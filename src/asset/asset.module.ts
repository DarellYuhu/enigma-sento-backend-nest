import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Music, MusicSchema } from './schemas/music.schema';
import { Font, FontSchema } from './schemas/font.schema';
import { MinioS3Module } from 'src/minio-s3/minio-s3.module';
import { Color, ColorSchema } from './schemas/color.schema';
import { Image, ImageSchema } from './schemas/image.schema';

@Module({
  imports: [
    MinioS3Module,
    MongooseModule.forFeature([
      { name: Music.name, schema: MusicSchema },
      { name: Font.name, schema: FontSchema },
      { name: Color.name, schema: ColorSchema },
      { name: Image.name, schema: ImageSchema },
    ]),
  ],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
