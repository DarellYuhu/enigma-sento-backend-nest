import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Story } from './schemas/story.schema';
import { S3Client } from 'bun';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateSectionRequestDto } from './dto/updateSection-story.dto';
import { random } from 'lodash';
import { AssetService } from 'src/asset/asset.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateStoryRequestDto } from './dto/update-story.dot';
import { AddGeneratedContentDto } from './dto/add-generated-content.dto';

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name) private story: Model<Story>,
    @Inject('S3_CLIENT') private minioS3: S3Client,
    @InjectQueue('script-queue')
    private queue: Queue,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly asset: AssetService,
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
    const normalized = stories.map((item) => ({
      ...item,
      data: item.data
        ? item.data.map((item) => ({
            ...item,
            images: item.images.map((image) => ({
              ...image,
              url: this.minioS3.presign(image.path, {
                bucket: 'assets',
                method: 'GET',
              }),
            })),
          }))
        : undefined,
    }));
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
          await this.minioS3.delete(image.path, { bucket: 'assets' });
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

  async generate(storyId: string, withMusic?: boolean) {
    const story = await this.story.findById(storyId).lean();
    const project = await this.prisma.project.findFirstOrThrow({
      where: { Story: { some: { id: storyId } } },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (
      ((story.type !== 'SYSTEM_GENERATE' ||
        story.captions?.length < (story.contentPerStory ?? -1)) &&
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
            item.images.map((imagePath) =>
              this.minioS3.presign(imagePath.path, {
                bucket: 'assets',
                method: 'GET',
              }),
            ),
          ),
        })),
      ),
      font: fonts[random(fonts.length - 1)],
      captions: story.captions ?? [],
      hashtags: story.hashtags ?? '',
      sounds: musicPath.map((path) =>
        this.minioS3.presign(path, { bucket: 'assets', method: 'GET' }),
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
        story.captions?.length < story.contentPerStory) &&
      project.allocationType === 'SPECIFIC'
    )
      throw new BadRequestException('Not enough files or captions');
    let offset = 0;
    const ContentDistribution = await this.prisma.contentDistribution.findMany({
      where: {
        OR: [{ DistributionStory: { some: { storyId } } }, { storyId }],
      },
      include: { GroupDistribution: true, DistributionStory: true },
    });
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
        await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} rm --recursive --force myminio/generated-content/${path}`;
        await this.minioS3.write(`${path}/captions.txt`, captions, {
          type: 'text/plain',
          bucket: 'generated-content',
        });
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
    await Promise.all(
      data.data.map((item) =>
        Promise.all(
          item.images.map(async (image) => {
            await this.minioS3.delete(image.path, { bucket: 'assets' });
          }),
        ),
      ),
    );
    return await this.prisma.story.delete({ where: { id } });
  }
}
