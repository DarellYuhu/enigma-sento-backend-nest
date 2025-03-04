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
import { Model, MongooseError } from 'mongoose';
import { Font } from './schemas/font.schema';
import { Color } from './schemas/color.schema';
import { ConfigService } from '@nestjs/config';
import { AddFontRequestDto } from './dto/add-font.dto';
import * as xlsx from 'xlsx';
import { plainToInstance } from 'class-transformer';
import { ColorValidator } from './validator/color.validator';
import { validate } from 'class-validator';
import { AddImageRequestDto } from './dto/add-image.dto';
import { Image } from './schemas/image.schema';
import sharp from 'sharp';

@Injectable()
export class AssetService {
  constructor(
    @Inject('S3_CLIENT') private minioS3: S3Client,
    @InjectModel(Music.name) private music: Model<Music>,
    @InjectModel(Font.name) private font: Model<Font>,
    @InjectModel(Color.name) private color: Model<Color>,
    @InjectModel(Image.name) private image: Model<Image>,
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
    await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} alias set myminio http://${this.config.get('MINIO_HOST')}:${this.config.get('MINIO_PORT')} ${this.config.get('MINIO_ACCESS_KEY')} ${this.config.get('MINIO_SECRET_KEY')}`;
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

  async findAllFont() {
    return (await this.font.find({}).lean()).map((item) => ({
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

  async addImages(payload: AddImageRequestDto) {
    const session = await this.image.startSession();
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
      const result = await this.image.insertMany(data);
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

  async getImages() {
    const data = (await this.image.find().lean()).map((item) => ({
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
}
