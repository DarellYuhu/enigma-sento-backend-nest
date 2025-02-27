import { Module } from '@nestjs/common';
import { GroupDistributionService } from './group-distribution.service';
import { GroupDistributionController } from './group-distribution.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MinioS3Module } from 'src/minio-s3/minio-s3.module';

@Module({
  imports: [MinioS3Module],
  controllers: [GroupDistributionController],
  providers: [GroupDistributionService, PrismaService],
})
export class GroupDistributionModule {}
