import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { S3Client } from 'bun';
import { parseBuffer } from 'music-metadata';
import { Music } from './schemas/music.schema';
import { Model } from 'mongoose';
import { Font } from './schemas/font.schema';

@Injectable()
export class AssetService {
  constructor(
    @Inject('S3_CLIENT') private minioS3: S3Client,
    @InjectModel(Music.name) private music: Model<Music>,
    @InjectModel(Font.name) private font: Model<Font>,
  ) {}

  async addMusics(files: Express.Multer.File[]) {
    await Promise.all(
      files.map(async (file) => {
        const metadata = await parseBuffer(file.buffer);
        await this.minioS3.write(`/musics/${file.filename}`, file.buffer, {
          bucket: 'assets',
        });
        await this.music.create({
          title: file.filename.split('.')[0],
          album: metadata.common.album,
          artist: metadata.common.artist,
          createdAt: metadata.format.creationTime,
          duration: metadata.format.duration,
          addedAt: new Date(),
          path: `/musics/${file.filename}`,
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

  async findAllFont() {
    return (await this.font.find({}).lean()).map((item) => ({
      ...item,
      url: this.minioS3.presign(item.path, { method: 'GET' }),
    }));
  }
}
