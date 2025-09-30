import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectRequestDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StoryService } from 'src/story/story.service';
import { shuffle } from 'lodash';
import { Prisma, Story } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MinioService } from 'src/core/minio/minio.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel('Story') private story: Model<Story>,
    private readonly prisma: PrismaService,
    private readonly storyService: StoryService,
    private readonly minio: MinioService,
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
    const project = await this.findProjectWithOtherData(projectId);
    this.validateProject(project);

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
              ): Promise<
                Prisma.ContentDistributionUncheckedCreateInput & {
                  storyCandidate?: Omit<
                    Prisma.DistributionStoryCreateManyInput,
                    'contentDistributionId'
                  >[];
                }
              > => {
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

                  const storyCandidate = Array.from(mappedStory).map(
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
                  storyCandidate.forEach((item) => {
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
                  await this.minio.putObject(
                    'generated-content',
                    `${path}/captions.txt`,
                    captions,
                  );
                  return {
                    projectId,
                    session: index + 1,
                    groupDistributionCode: groupDistributionId,
                    workgroupId: workgroupId,
                    path,
                    storyCandidate,
                    DistributionStory: {
                      createMany: { data: storyCandidate },
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
                  // storyId: randomizedStory[storyIndex].id,
                  workgroupId: workgroupId,
                  path,
                  projectId,
                  content: {
                    createMany: {
                      data: Array.from({ length: amontOfTroops }).map(() => ({
                        storyId: randomizedStory[storyIndex].id,
                      })),
                    },
                  },
                  DistributionStory: {
                    create: {
                      storyId: randomizedStory[storyIndex].id,
                      amountOfContents: amontOfTroops,
                      offset: 0,
                    },
                  },
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

    const contentDistributionTransaction = payload.map(
      ({ storyCandidate, ...item }) =>
        this.prisma.contentDistribution.create({
          data: {
            ...item,
            ...(storyCandidate && {
              content: {
                createMany: {
                  data: storyCandidate.flatMap((item) =>
                    Array.from({ length: item.amountOfContents }).map(() => ({
                      storyId: item.storyId,
                    })),
                  ),
                },
              },
            }),
          },
        }),
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

  private validateProject(
    project: Awaited<ReturnType<typeof this.findProjectWithOtherData>>,
  ) {
    if (!project) throw new NotFoundException('Project or workgroup not found');
    if (
      project.Story.length < project.Workgroup.session ||
      project.Story.length < project.Workgroup.projectStoryPerUser
    )
      throw new BadRequestException(
        `Not enough stories. You need at least ${project.Workgroup.projectStoryPerUser} stories`,
      );
  }

  private findProjectWithOtherData(id: string) {
    return this.prisma.project.findFirstOrThrow({
      where: { id },
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
                    WorkgroupUser: { Project: { some: { id } } },
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
  }
}
