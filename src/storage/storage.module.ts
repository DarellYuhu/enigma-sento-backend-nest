import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { MinioS3Module } from 'src/core/minio-s3/minio-s3.module';

@Module({
  imports: [MinioS3Module],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}
