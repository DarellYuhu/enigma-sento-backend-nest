import { Module } from '@nestjs/common';
import { GroupDistributionService } from './group-distribution.service';
import { GroupDistributionController } from './group-distribution.controller';
import { MinioS3Module } from 'src/core/minio-s3/minio-s3.module';

@Module({
  imports: [MinioS3Module],
  controllers: [GroupDistributionController],
  providers: [GroupDistributionService],
})
export class GroupDistributionModule {}
