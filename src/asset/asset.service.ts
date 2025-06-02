import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { S3Client, S3File } from 'bun';
import { parseBuffer } from 'music-metadata';
import { Music } from './schemas/music.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { Font } from './schemas/font.schema';
import { Color } from './schemas/color.schema';
import { ConfigService } from '@nestjs/config';
import { AddFontRequestDto } from './dto/add-font.dto';
import * as xlsx from 'xlsx';
import { plainToInstance, Type } from 'class-transformer';
import { ColorValidator } from './validator/color.validator';
import { validate } from 'class-validator';
import { AddRepImageRequestDto } from './dto/add-rep-image.dto';
import { RepImage } from './schemas/rep-image.schema';
import sharp from 'sharp';
import { Video } from './schemas/video.schema';
import ffmpeg from 'fluent-ffmpeg';
import { AddVideoRequestDto } from './dto/add-video.dto';
import { AddBannerRequestDto } from './dto/add-banner.dto';
import { Banner } from './schemas/banner.schema';
import { AddImageRequestDto } from './dto/add-image.dto';
import { Image } from './schemas/image.schema';
import { AiService } from 'src/core/ai/ai.service';
import { QdrantService } from 'src/core/qdrant/qdrant.service';
import { People } from 'src/collection/schemas/people.schema';
import { CollectionService } from 'src/collection/collection.service';

@Injectable()
export class AssetService {
  constructor(
    @Inject('S3_CLIENT') private minioS3: S3Client,
    @InjectModel(Music.name) private music: Model<Music>,
    @InjectModel(Font.name) private font: Model<Font>,
    @InjectModel(Color.name) private color: Model<Color>,
    @InjectModel(RepImage.name) private repImage: Model<RepImage>,
    @InjectModel(Image.name) private image: Model<Image>,
    @InjectModel(Video.name) private video: Model<Video>,
    @InjectModel(Banner.name) private banner: Model<Banner>,
    private readonly collectionService: CollectionService,
    private readonly qdrantService: QdrantService,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {}

  async addMusics(files: Express.Multer.File[]) {
    await Promise.all(
      files.map(async (file) => {
        const metadata = await parseBuffer(file.buffer);
        await this.minioS3.write(`/musics/${file.filename}`, file.buffer, {
          bucket: 'assets',
        });
        await this.music.create({
          title: file.originalname.split('.')[0],
          album: metadata.common.album,
          artist: metadata.common.artist,
          createdAt: metadata.format.creationTime,
          duration: metadata.format.duration,
          addedAt: new Date(),
          path: `/musics/${file.originalname}`,
          size: file.size,
          type: file.mimetype,
          year: metadata.common.year ?? metadata.common.originalyear,
        });
      }),
    );
  }

  async findAllMusic() {
    return (await this.music.find({}).lean()).map((item) => ({
      ...item,
      path: this.minioS3.presign(item.path, {
        bucket: 'assets',
        method: 'GET',
      }),
    }));
  }

  async addFonts(payload: AddFontRequestDto) {
    const data = await Promise.all(
      payload.data.map(async (file) => {
        const target = `assets/all/fonts/${file.name}`;
        await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${file.path} myminio/${target}`;
        return { name: file.name, path: target };
      }),
    );
    const result = await this.font.insertMany(data).catch((err) => {
      if (err.code === 11000)
        throw new ConflictException('Some font already exists');
      throw err;
    });
    return result.map(({ name, path, _id }) => ({ name, path, _id }));
  }

  async findAllFont(fontId?: string[]) {
    const query = fontId ? { _id: { $in: fontId } } : {};
    return (await this.font.find(query).lean()).map((item) => ({
      ...item,
      url: this.minioS3.presign(item.path, { method: 'GET' }),
    }));
  }

  deleteFont(id: string) {
    return this.font.deleteOne({ _id: id });
  }

  async addColors(file: Express.Multer.File) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const instance = plainToInstance(ColorValidator, { data: json });
    const errors = await validate(instance);
    if (errors.length > 0) throw new BadRequestException('Invalid model');
    await this.color.insertMany(instance.data);
  }

  findAllColor() {
    return this.color.find({}).lean();
  }

  async getImages({
    query,
    searchType = 'semantic',
    collectionId,
  }: {
    query: string;
    collectionId: string;
    searchType: 'full-text' | 'semantic' | 'people';
  }) {
    let ids: Types.ObjectId[] = [];
    let filter: PipelineStage[] = [
      { $sort: { createdAt: -1 } },
      { $limit: 1000 },
      {
        $lookup: {
          from: 'peoples',
          localField: 'people',
          foreignField: '_id',
          as: 'people',
        },
      },
    ];

    if (query && searchType === 'semantic') {
      const [text, img] = await Promise.all([
        this.aiService.embeddingText(query),
        this.aiService.embeddingImage({ text: query }),
      ]);
      const result = await Promise.all([
        this.qdrantService.query('text-based', text, 0.5),
        this.qdrantService.query('image-based', img, 0.1),
      ]);
      ids = result.flat().map((id) => new Types.ObjectId(id));
      filter.push({ $match: { _id: { $in: ids } } });
    }

    if (collectionId) {
      const collection = await this.collectionService.findOne(collectionId);
      if (ids.length > 0) {
        filter.push({
          $match: {
            _id: {
              $in: ids
                .filter((id) => collection.assets.includes(id.toString()))
                .map((id) => new Types.ObjectId(id)),
            },
          },
        });
      } else {
        filter.push({
          $match: {
            _id: { $in: collection.assets.map((id) => new Types.ObjectId(id)) },
          },
        });
      }
    }

    if (searchType === 'full-text') {
      filter.unshift({
        $match: {
          $text: {
            $search: this.buildExactTextSearch(query),
          },
        },
      });
    }

    if (searchType === 'people')
      filter.push({
        $match: { people: { $elemMatch: { name: query } } },
      });
    filter.push({ $limit: 50 });

    const data = (await this.image.aggregate(filter)).map((item) => {
      return {
        ...item,
        people: Object.values(item.people) as unknown as People[],
        url: this.minioS3.presign(item.path, { method: 'GET' }),
      };
    });
    return data;
  }

  async getImageById(id: string) {
    return this.image
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .then((item) => {
        console.log(item);
        return {
          ...item,
          url: this.minioS3.presign(item.path, { method: 'GET' }),
        };
      });
  }

  async addImages(payload: AddImageRequestDto) {
    const normalized = await Promise.all(
      payload.data.map(async ({ name, path, ...item }) => {
        const _id = new Types.ObjectId();
        const file = this.minioS3.file(path, { bucket: 'tmp' });
        const metadata = await this.getImageMetadata(file);
        const target = `assets/all/images/${name}`;
        const imgUrl = this.minioS3.presign(path, {
          endpoint: this.config.get('MINIO_URI'),
          method: 'GET',
          bucket: 'tmp',
        });

        const vectors = await Promise.all([
          {
            type: 'img',
            value: await this.aiService.embeddingImage({ uri: imgUrl }),
          },
          {
            type: 'txt',
            value: await this.aiService.embeddingText(item.description),
          },
          ...item.tags.map(async (t) => ({
            type: 'txt',
            value: await this.aiService.embeddingText(t),
          })),
        ]);
        return {
          _id,
          name,
          path: target,
          vectors,
          ...metadata,
          ...item,
          people: item.people.map((p) => new Types.ObjectId(p)),
        };
      }),
    );
    const data = normalized.flatMap((item) =>
      item.vectors.map((vector) => ({ storyId: item._id.toString(), vector })),
    );
    const vectorsMap = new Map<
      string,
      { storyId: string; vector: number[] }[]
    >();
    data.forEach(({ vector, storyId }) => {
      if (!vectorsMap.has(vector.type)) vectorsMap.set(vector.type, []);
      vectorsMap.get(vector.type)!.push({ storyId, vector: vector.value });
    });

    await this.qdrantService.createCollection('image-based', {
      vectors: { size: 512, distance: 'Cosine' },
    });
    await this.qdrantService.createCollection('text-based', {
      vectors: { size: 384, distance: 'Cosine' },
    });
    await Promise.all(
      Array.from(vectorsMap.entries()).map(async ([type, vectors]) => {
        switch (type) {
          case 'img':
            return this.qdrantService.insertData({
              collectionName: 'image-based',
              points: vectors,
            });
          case 'txt':
            return this.qdrantService.insertData({
              collectionName: 'text-based',
              points: vectors,
            });
        }
      }),
    );
    const mongoPayload = normalized.map(({ vectors: _, ...item }) => item);
    const result = await this.image.insertMany(mongoPayload);
    await Promise.all(
      payload.data.map(async ({ path, name }) => {
        const target = `assets/all/images/${name}`;
        await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${path} myminio/${target}`;
      }),
    );
    return result.length;
  }

  async addRepImages(payload: AddRepImageRequestDto) {
    const session = await this.repImage.startSession();
    session.startTransaction();
    try {
      const data = await Promise.all(
        payload.data.map(async ({ name, path }) => {
          const file = this.minioS3.file(path, { bucket: 'tmp' });
          const metadata = await this.getImageMetadata(file);
          const target = `assets/repurpose/images/${name}`;
          return { name, path: target, ...metadata };
        }),
      );
      const result = await this.repImage.insertMany(data);
      await session.commitTransaction();
      session.endSession();
      await Promise.all(
        payload.data.map(async ({ path, name }) => {
          const target = `assets/repurpose/images/${name}`;
          await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${path} myminio/${target}`;
        }),
      );
      return result.length;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new ConflictException('Image with the same name already exist!');
      }
      throw error;
    }
  }

  async getRepImages() {
    const data = (await this.repImage.find().lean()).map((item) => ({
      ...item,
      url: this.minioS3.presign(item.path, { method: 'GET' }),
    }));
    return data;
  }

  async addVideos(payload: AddVideoRequestDto) {
    const session = await this.video.startSession();
    session.startTransaction();
    try {
      const data = await Promise.all(
        payload.data.map(async ({ name, path }) => {
          const file = this.minioS3.presign(path, {
            bucket: 'tmp',
            method: 'GET',
          });
          const metadata = await this.getVideoMetadata(file);
          const target = `assets/repurpose/videos/${name}`;
          return { name, path: target, ...metadata };
        }),
      );
      const result = await this.video.insertMany(data);
      await session.commitTransaction();
      session.endSession();
      await Promise.all(
        payload.data.map(async ({ path, name }) => {
          const target = `assets/repurpose/videos/${name}`;
          await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${path} myminio/${target}`;
        }),
      );
      return result.length;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new ConflictException('Image with the same name already exist!');
      }
      throw error;
    }
  }

  async getVideos() {
    const data = (await this.video.find().lean()).map((item) => ({
      ...item,
      url: this.minioS3.presign(item.path, { method: 'GET' }),
    }));
    return data;
  }

  async addBanners(payload: AddBannerRequestDto) {
    const session = await this.banner.startSession();
    session.startTransaction();
    try {
      const data = await Promise.all(
        payload.data.map(async ({ name, path }) => {
          const file = this.minioS3.file(path, { bucket: 'tmp' });
          const metadata = await this.getImageMetadata(file);
          const target = `assets/repurpose/banners/${name}`;
          return { name, path: target, ...metadata };
        }),
      );
      const result = await this.banner.insertMany(data);
      await session.commitTransaction();
      session.endSession();
      await Promise.all(
        payload.data.map(async ({ path, name }) => {
          const target = `assets/repurpose/banners/${name}`;
          await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${path} myminio/${target}`;
        }),
      );
      return result.length;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new ConflictException('Banner with the same name already exist!');
      }
      throw error;
    }
  }

  async getBanners() {
    const data = (await this.banner.find().lean()).map((item) => ({
      ...item,
      url: this.minioS3.presign(item.path, { method: 'GET' }),
    }));
    return data;
  }

  private async getImageMetadata(file: S3File) {
    const buff = await file.arrayBuffer();
    const { width, height, size } = await sharp(buff).metadata();

    return {
      type: file.type,
      width,
      height,
      size,
    };
  }

  private buildExactTextSearch(userInput: string): any {
    const sanitized = userInput.trim().replace(/"/g, '');
    const exactPhrase = `"${sanitized}"`;
    return exactPhrase;
  }

  private async getVideoMetadata(source: string) {
    const data: ffmpeg.FfprobeData = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(source, (err, metadata) => {
        if (err) reject(err);
        resolve(metadata);
      });
    });

    return {
      type: data.streams[0].codec_name,
      width: data.streams[0].width,
      height: data.streams[0].height,
      size: data.format.size,
      duration: data.format.duration,
    };
  }
}
