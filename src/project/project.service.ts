import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectRequestDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
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
    const { name, workgroupId, allocationType, captions, hashtags } = payload;
    const project = await this.prisma.$transaction(async (db) => {
      const workgroupUser = await db.workgroupUser.findFirst({
        where: { workgroupId, userId, User: { role: 'CREATOR' } },
      });

      if (!workgroupUser)
        throw new NotFoundException('Workgroup user not found');

      return db.project.create({
        data: {
          name,
          workgroupId,
          allocationType,
          captions: captions?.split('\n'),
          hashtags,
          workgroupUserId: workgroupUser.id,
        },
      });
    });

    return project;
  }

  findAll() {
    return `This action returns all project`;
  }

  async findByWorkgroupId(workgroupId: string, userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { workgroupId, WorkgroupUser: { userId } },
      include: { Story: { orderBy: { id: 'asc' } } },
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

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
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
    const map: Map<string, number> = new Map();
    const randomizedStory = shuffle(prismaStory);

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
                const path = `${code}/${project.name}/${index + 1}`;

                if (project.allocationType === 'GENERIC') {
                  const devided = Math.floor(
                    amontOfTroops / randomizedStory.length,
                  );
                  const amountOfContents = devided === 0 ? 1 : devided;
                  const modulo = amontOfTroops % randomizedStory.length;
                  let offset = 0;
                  const payload = randomizedStory.map(({ id: storyId }) => {
                    const data = {
                      amountOfContents,
                      offset,
                      storyId,
                    };
                    offset += amountOfContents;
                    return data;
                  });
                  if (modulo > 0) {
                    Array.from({ length: modulo }).forEach(
                      (_, idx) => (payload[idx].amountOfContents += 1),
                    );
                  }
                  payload.forEach((item) => {
                    if (map.has(item.storyId)) {
                      const value = map.get(item.storyId);
                      map.set(item.storyId, value! + item.amountOfContents);
                    } else {
                      map.set(item.storyId, item.amountOfContents);
                    }
                  });
                  const texts = project.captions?.map(
                    (item) => item + ' ' + project.hashtags,
                  );
                  offset += amountOfContents;
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

                if (map.has(randomizedStory[storyIndex].id)) {
                  const value = map.get(randomizedStory[storyIndex].id);
                  map.set(
                    randomizedStory[storyIndex].id,
                    value! + amontOfTroops,
                  );
                } else {
                  map.set(randomizedStory[storyIndex].id, amontOfTroops);
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
      Array.from(map, ([key, value]) => {
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
