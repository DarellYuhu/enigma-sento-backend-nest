import { Module } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { LayoutController } from './layout.controller';
import { MinioS3Module } from 'src/core/minio-s3/minio-s3.module';
import { AssetModule } from 'src/asset/asset.module';

@Module({
  imports: [MinioS3Module, AssetModule],
  controllers: [LayoutController],
  providers: [LayoutService],
})
export class LayoutModule {}
