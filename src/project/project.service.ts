import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectRequestDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StoryService } from 'src/story/story.service';
import { shuffle } from 'lodash';
import { Prisma, Story } from '@prisma/client';
import { S3Client } from 'bun';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProjectService {
  constructor(
    @Inject('S3_CLIENT') private minioS3: S3Client,
    @InjectModel('Story') private story: Model<Story>,
    private readonly prisma: PrismaService,
    private readonly storyService: StoryService,
  ) {}

  async create(payload: CreateProjectRequestDto, userId: string) {
    const {
      name,
      workgroupId,
      allocationType,
      captions,
      hashtags,
      proposalId,
    } = payload;
    let Proposal = {};
    const workgroup = await this.prisma.workgroup
      .findUniqueOrThrow({
        where: { id: workgroupId },
      })
      .catch(() => {
        throw new NotFoundException('Workgroup not found!');
      });
    const workgroupUser = await this.prisma.workgroupUser
      .findFirstOrThrow({
        where: { workgroupId, userId, User: { role: 'CREATOR' } },
      })
      .catch(() => {
        throw new NotFoundException('Workgroup user not found');
      });
    if (workgroup.withTicket === true && !proposalId)
      throw new BadRequestException('Proposal is required');
    if (proposalId) Proposal = { connect: { id: proposalId } };
    return this.prisma.project.create({
      data: {
        name,
        workgroupId,
        allocationType,
        captions: captions?.split('\n'),
        hashtags,
        workgroupUserId: workgroupUser.id,
        Proposal,
      },
    });
  }

  findAll() {
    return `This action returns all project`;
  }

  async findByWorkgroupId(workgroupId: string, userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { workgroupId, WorkgroupUser: { userId } },
      include: { Story: { orderBy: { id: 'asc' } } },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    });
    if (!projects) throw new NotFoundException('Projects not found');

    const response = await Promise.all(
      projects.map(async ({ Story, ...item }) => ({
        ...item,
        Story: await this.storyService.findByProjectId(item.id),
      })),
    );

    return response;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: string, updateProjectDto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }

  async generateDistribution(projectId: string) {
    const project = await this.prisma.project.findFirstOrThrow({
      where: { id: projectId },
      include: {
        Story: true,
        Workgroup: {
          select: {
            projectStoryPerUser: true,
            session: true,
            TaskHistory: {
              select: {
                WorkgroupUserTask: {
                  include: { GroupDistribution: true },
                  where: {
                    WorkgroupUser: { Project: { some: { id: projectId } } },
                  },
                },
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project or workgroup not found');
    if (
      project.Story.length < project.Workgroup.session ||
      project.Story.length < project.Workgroup.projectStoryPerUser
    )
      throw new BadRequestException(
        `Not enough stories. You need at least ${project.Workgroup.projectStoryPerUser} stories`,
      );
    const {
      Story: prismaStory,
      workgroupId,
      Workgroup: {
        TaskHistory: [{ WorkgroupUserTask }],
        session,
      },
    } = project;

    let storyIndex = 0;
    let offset = 0;
    const contentForEachStory: Map<string, number> = new Map();
    let randomizedStory = shuffle(prismaStory);

    const storyDistribution = await Promise.all(
      WorkgroupUserTask.map(
        async ({
          GroupDistribution: { amontOfTroops, code },
          groupDistributionId,
        }) => {
          return await Promise.all(
            Array.from({ length: session }).map(
              async (
                _,
                index,
              ): Promise<Prisma.ContentDistributionUncheckedCreateInput> => {
                randomizedStory = shuffle(randomizedStory);
                const path = `${code}/${project.name}/${index + 1}`;

                if (project.allocationType === 'GENERIC') {
                  const mappedStory = new Map<string, number>();
                  let storyIndex = 0;
                  Array.from({ length: amontOfTroops }).forEach(() => {
                    if (mappedStory.has(randomizedStory[storyIndex].id)) {
                      const value = mappedStory.get(
                        randomizedStory[storyIndex].id,
                      );
                      mappedStory.set(
                        randomizedStory[storyIndex].id,
                        value! + 1,
                      );
                    } else {
                      mappedStory.set(randomizedStory[storyIndex].id, 1);
                    }
                    storyIndex = (storyIndex + 1) % randomizedStory.length;
                  });

                  const payload = Array.from(mappedStory).map(
                    ([storyId, amountOfContents]) => {
                      const data = {
                        amountOfContents,
                        storyId,
                        offset,
                      };
                      offset += amountOfContents;
                      return data;
                    },
                  );
                  payload.forEach((item) => {
                    if (contentForEachStory.has(item.storyId)) {
                      const value = contentForEachStory.get(item.storyId);
                      contentForEachStory.set(
                        item.storyId,
                        value! + item.amountOfContents,
                      );
                    } else {
                      contentForEachStory.set(
                        item.storyId,
                        item.amountOfContents,
                      );
                    }
                  });
                  const texts = project.captions?.map(
                    (item) => item + ' ' + project.hashtags,
                  );
                  const captions = Buffer.from(texts.join('\n'), 'utf-8');
                  await this.minioS3.write(`${path}/captions.txt`, captions, {
                    type: 'text/plain',
                    bucket: 'generated-content',
                  });
                  return {
                    projectId,
                    session: index + 1,
                    groupDistributionCode: groupDistributionId,
                    workgroupId: workgroupId,
                    path,
                    DistributionStory: {
                      createMany: { data: payload },
                    },
                  };
                }

                if (contentForEachStory.has(randomizedStory[storyIndex].id)) {
                  const value = contentForEachStory.get(
                    randomizedStory[storyIndex].id,
                  );
                  contentForEachStory.set(
                    randomizedStory[storyIndex].id,
                    value! + amontOfTroops,
                  );
                } else {
                  contentForEachStory.set(
                    randomizedStory[storyIndex].id,
                    amontOfTroops,
                  );
                }

                const data = {
                  session: index + 1,
                  groupDistributionCode: groupDistributionId,
                  storyId: randomizedStory[storyIndex].id,
                  workgroupId: workgroupId,
                  path,
                  projectId,
                };
                storyIndex = (storyIndex + 1) % randomizedStory.length;
                return data;
              },
            ),
          );
        },
      ),
    );

    const payload = storyDistribution.flat();

    await Promise.all(
      Array.from(contentForEachStory, ([key, value]) => {
        return this.story.updateOne(
          {
            _id: key,
          },
          { contentPerStory: value },
        );
      }),
    );

    const contentDistributionTransaction = payload.map((item) =>
      this.prisma.contentDistribution.create({ data: item }),
    );

    const updateProjectStatus = this.prisma.project.update({
      where: { id: projectId },
      data: { status: true },
    });

    await this.prisma.$transaction([
      ...contentDistributionTransaction,
      updateProjectStatus,
    ]);
  }
}
