import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Story } from './schemas/story.schema';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateSectionRequestDto } from './dto/updateSection-story.dto';
import { random } from 'lodash';
import { AssetService } from 'src/asset/asset.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateStoryRequestDto } from './dto/update-story.dot';
import { AddGeneratedContentDto } from './dto/add-generated-content.dto';
import { AddContentWithSectionDto } from './dto/add-content-with-section.dto';
import { fileTypeFromBuffer } from 'file-type';
import { MinioService } from 'src/core/minio/minio.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name) private story: Model<Story>,
    @InjectQueue('script-queue')
    private queue: Queue,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly asset: AssetService,
    private readonly minio: MinioService,
  ) {}

  async create({ data, ...payload }: CreateStoryDto) {
    await this.prisma.project.findUniqueOrThrow({
      where: { id: payload.projectId },
    });
    const id = new mongoose.Types.ObjectId();
    const section = data
      ? await Promise.all(
          data.map(async (item) => {
            const images = await Promise.all(
              item.images.map(async (path) => {
                if (item.imageType === 'Collection') {
                  return path;
                }
                const newPath = `stories/${id}/${path.name}`;
                await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${path.path} myminio/assets/${newPath}`;
                return { path: newPath, name: path.name };
              }),
            );
            return { ...item, images };
          }),
        )
      : undefined;
    const doc = new this.story({
      _id: id,
      ...payload,
      data: section,
    });

    const result = await doc.save();
    await this.prisma.story.create({
      data: { id: result._id.toString(), projectId: payload.projectId },
    });
    return await this.story.findById(result._id).lean();
  }

  findAll() {
    return `This action returns all story`;
  }

  async findByProjectId(projectId: string) {
    const stories = await this.story
      .find({ projectId })
      .sort({ createdAt: 'desc' })
      .lean();
    const normalized = await Promise.all(
      stories.map(async (item) => ({
        ...item,
        data: item.data
          ? await Promise.all(
              item.data.map(async (item) => ({
                ...item,
                images: await Promise.all(
                  item.images.map(async (image) => ({
                    ...image,
                    url: await this.minio.presignedGetObject(
                      'assets',
                      image.path,
                    ),
                  })),
                ),
              })),
            )
          : undefined,
      })),
    );
    return normalized;
  }

  findOne(id: number) {
    return `This action returns a #${id} story`;
  }

  async update(id: string, payload: UpdateStoryRequestDto) {
    const story = await this.story.findById(id);
    if (!story) throw new NotFoundException('Story not found');
    if (
      payload.captions &&
      payload.captions.length < (story.contentPerStory ?? Infinity)
    )
      throw new BadRequestException('Not enough captions');
    return this.story.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async updateSection(
    storyId: string,
    sectionId: string,
    data: UpdateSectionRequestDto,
  ) {
    if (data.deletedImages) {
      await Promise.all(
        data.deletedImages.map(async (image) => {
          await this.minio.removeObject('assets', image.path);
        }),
      );
    }
    if (data.newImages) {
      const newImages = await Promise.all(
        data.newImages.map(async (path) => {
          const newPath = `stories/${storyId}/${path.name}`;
          await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${path.path} myminio/assets/${newPath}`;
          return { path: newPath, name: path.name };
        }),
      );
      if (!data.images) data.images = [];
      data.images.push(...newImages);
    }

    const updates = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [`data.$.${key}`, value]),
    );

    const section = await this.story.findOneAndUpdate(
      { _id: storyId, 'data._id': sectionId },
      { $set: updates },
      { new: true },
    );
    return section;
  }

  async addContentWithSection(id: string, payload: AddContentWithSectionDto) {
    const story = await this.story.findById(id).lean();
    const project = await this.prisma.project.findFirstOrThrow({
      where: { Story: { some: { id: id } } },
    });
    if (!story) throw new NotFoundException('Story not found');
    let offset = 0;
    const contentDist = await this.findContentDistribution(id);
    const contentTemplates = contentDist.flatMap((item) => item.content);
    const huhi = new Map<
      number,
      { contentId: string; files: Prisma.FileCreateManyInput[] }
    >();
    const bucket = 'generated-content';

    for (const content of contentDist) {
      const distStory = content.DistributionStory.find(
        (item) => item.storyId === id,
      );
      const amountOfContents =
        content.DistributionStory.find((item) => item.storyId === id)
          ?.amountOfContents ?? content.GroupDistribution.amontOfTroops;
      const path = this.getPath(project.allocationType, content.path);
      const texts = story
        .captions!.slice(offset, amountOfContents + offset)
        .map((item) => item + ' ' + story.hashtags);
      const captions = Buffer.from(texts.join('\n'), 'utf-8');
      await this.minio.putObject(bucket, `${path}/captions.txt`, captions);
      const files = await Promise.all(
        Object.values(payload.files)
          .map((section, sectionIdx) =>
            section
              .slice(offset, amountOfContents + offset)
              .map(async (file, fileIdx) => {
                const currentIndex = fileIdx + offset;
                const fileName = `sort_${sectionIdx + 1}_${distStory!.offset + fileIdx + 1}.${(await fileTypeFromBuffer(file.buffer!))?.ext}`;
                const isExist = huhi.has(currentIndex);
                const fileMetadata = {
                  bucket,
                  fullPath: `${bucket}/${path}/${fileName}`,
                  path: `${path}/${fileName}`,
                  name: fileName,
                };
                if (isExist) {
                  const currVal = huhi.get(currentIndex);
                  currVal!.files.push(fileMetadata);
                  huhi.set(currentIndex, currVal!);
                } else
                  huhi.set(currentIndex, {
                    files: [fileMetadata],
                    contentId: contentTemplates[currentIndex].id,
                  });
                return {
                  file,
                  fileName,
                };
              }),
          )
          .flat(),
      );
      offset += amountOfContents;
      await Promise.all(
        files.map(async (item) => {
          await this.minio.putObject(
            'generated-content',
            `${path}/${item.fileName}`,
            item.file.buffer!,
          );
        }),
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      const files = await prisma.file.createManyAndReturn({
        data: Array.from(huhi).flatMap(([_, val]) =>
          val.files.map((item) => item),
        ),
      });
      await Promise.all(
        Array.from(huhi).map(([_, val]) =>
          prisma.content.update({
            where: { id: val.contentId },
            data: {
              contentFile: {
                createMany: {
                  data: val.files.map((file) => ({
                    ...file,
                    fileId: files.find((x) => x.path === file.path)!.id,
                  })),
                },
              },
            },
          }),
        ),
      );
    });

    const res = await this.story
      .findByIdAndUpdate(id, {
        generatorStatus: 'FINISHED',
      })
      .lean();
    return res;
  }

  async generate(storyId: string, withMusic?: boolean) {
    const story = await this.story.findById(storyId).lean();
    const project = await this.prisma.project.findFirstOrThrow({
      where: { Story: { some: { id: storyId } } },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (
      ((story.type !== 'SYSTEM_GENERATE' ||
        (story.captions?.length || 0) < (story.contentPerStory ?? -1)) &&
        project.allocationType === 'SPECIFIC') ||
      !story.data
    )
      throw new BadRequestException(
        `You have to provide at least ${story.contentPerStory} captions`,
      );
    await this.story.findByIdAndUpdate(storyId, { generatorStatus: 'RUNNING' });
    const musicPath = withMusic
      ? (await this.asset.findAllMusic()).map(({ path }) => path)
      : [];
    const sections = story.data;
    const fonts = (await this.asset.findAllFont()).map((item) => item.url);
    const ContentDistribution = await this.prisma.contentDistribution.findMany({
      where: {
        OR: [{ DistributionStory: { some: { storyId } } }, { storyId }],
      },
      include: {
        GroupDistribution: true,
        DistributionStory: { where: { storyId } },
      },
    });
    const config = {
      sections: await Promise.all(
        sections.map(async (item) => ({
          ...item,
          images: await Promise.all(
            item.images.map((image) =>
              this.minio.presignedGetObject('assets', image.path),
            ),
          ),
        })),
      ),
      font: fonts[random(fonts.length - 1)],
      captions: story.captions ?? [],
      hashtags: story.hashtags ?? '',
      sounds: musicPath.map(async (path) =>
        this.minio.presignedGetObject('assets', path),
      ),
      groupDistribution: ContentDistribution.map((item) => {
        const distributionStory = item.DistributionStory.find(
          (item) => item.storyId === storyId,
        );
        return {
          amountOfContents:
            distributionStory?.amountOfContents ??
            item.GroupDistribution.amontOfTroops,
          path: distributionStory ? `${item.path}/SG` : item.path,
          offset: distributionStory?.offset,
        };
      }),
      basePath: `${process.cwd()}/tmp/${storyId}`,
    };

    await Bun.$`mkdir -p ${config.basePath}`;

    await this.queue.add(storyId, { ...config, storyId });
  }

  async addGeneratedContent(storyId: string, payload: AddGeneratedContentDto) {
    const story = await this.story.findById(storyId).lean();
    const project = await this.prisma.project.findFirstOrThrow({
      where: { Story: { some: { id: storyId } } },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (
      (story.contentPerStory !== payload.files.length ||
        (story.captions?.length || 0) < story.contentPerStory) &&
      project.allocationType === 'SPECIFIC'
    )
      throw new BadRequestException('Not enough files or captions');
    let offset = 0;
    const ContentDistribution = await this.findContentDistribution(storyId);
    await Promise.all(
      ContentDistribution.map(async (content) => {
        const amountOfContents =
          content.DistributionStory.find((item) => item.storyId === storyId)
            ?.amountOfContents ?? content.GroupDistribution.amontOfTroops;

        const path =
          project.allocationType === 'GENERIC'
            ? `${content.path}/UG`
            : content.path;
        const filesPayload = payload.files.slice(
          offset,
          amountOfContents + offset,
        );
        const texts = story
          .captions!.slice(offset, amountOfContents + offset)
          .map((item) => item + ' ' + story.hashtags);
        offset += amountOfContents;
        const captions = Buffer.from(texts.join('\n'), 'utf-8');
        await this.minio.putObject(
          'generated-content',
          `${path}/captions.txt`,
          captions,
        );
        await Promise.all(
          filesPayload.map(
            async (file) =>
              await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv "myminio/tmp/${file}" "myminio/generated-content/${path}/${file}"`,
          ),
        );
      }),
    );
    const res = await this.story
      .findByIdAndUpdate(storyId, {
        generatorStatus: 'FINISHED',
      })
      .lean();
    return res;
  }

  async remove(id: string) {
    const data = await this.story.findOneAndDelete({ _id: id });
    if (!data) throw new NotFoundException('Story not found!');
    if (data.data)
      await Promise.all(
        data.data.map((item) =>
          Promise.all(
            item.images.map(async (image) => {
              await this.minio.removeObject('assets', image.path);
            }),
          ),
        ),
      );
    return await this.prisma.story.delete({ where: { id } });
  }

  private getPath(allocationType: string, path: string) {
    return allocationType === 'GENERIC' ? `${path}/UG` : path;
  }
  private findContentDistribution(storyId: string) {
    return this.prisma.contentDistribution.findMany({
      where: {
        OR: [{ DistributionStory: { some: { storyId } } }, { storyId }],
      },
      include: {
        GroupDistribution: true,
        DistributionStory: true,
        content: {
          where: {
            storyId,
          },
        },
      },
    });
  }
}
