import { Inject, Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Story } from './schemas/story.schema';
import { S3Client } from 'bun';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateSectionRequestDto } from './dto/updateSection-story.dto';

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name) private story: Model<Story>,
    @Inject('S3_CLIENT') private minioS3: S3Client,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create({ data, ...payload }: CreateStoryDto) {
    await this.prisma.project.findUniqueOrThrow({
      where: { id: payload.projectId },
    });
    const id = new mongoose.Types.ObjectId();
    await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} alias set myminio http://${this.config.get('MINIO_HOST')}:${this.config.get('MINIO_PORT')} ${this.config.get('MINIO_ACCESS_KEY')} ${this.config.get('MINIO_SECRET_KEY')}`;
    const section = data
      ? await Promise.all(
          data.map(async (item) => {
            const images = await Promise.all(
              item.images.map(async (path) => {
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

  async updateSection(
    storyId: string,
    sectionId: string,
    data: UpdateSectionRequestDto,
  ) {
    await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} alias set myminio http://${this.config.get('MINIO_HOST')}:${this.config.get('MINIO_PORT')} ${this.config.get('MINIO_ACCESS_KEY')} ${this.config.get('MINIO_SECRET_KEY')}`;
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

  remove(id: number) {
    return `This action removes a #${id} story`;
  }
}
