import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Music, MusicSchema } from './schemas/music.schema';
import { Font, FontSchema } from './schemas/font.schema';
import { MinioS3Module } from 'src/core/minio-s3/minio-s3.module';
import { Color, ColorSchema } from './schemas/color.schema';
import { Video, VideoSchema } from './schemas/video.schema';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { RepImage, RepImageSchema } from './schemas/rep-image.schema';
import { Image, ImageSchema } from './schemas/image.schema';
import { QdrantModule } from 'src/core/qdrant/qdrant.module';
import { AiModule } from 'src/core/ai/ai.module';
import { CollectionModule } from 'src/collection/collection.module';

@Module({
  imports: [
    CollectionModule,
    AiModule,
    QdrantModule,
    MinioS3Module,
    MongooseModule.forFeature([
      { name: Music.name, schema: MusicSchema },
      { name: Font.name, schema: FontSchema },
      { name: Color.name, schema: ColorSchema },
      { name: RepImage.name, schema: RepImageSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Video.name, schema: VideoSchema },
      { name: Banner.name, schema: BannerSchema },
    ]),
  ],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
