import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { StoryModule } from 'src/story/story.module';
import { MinioS3Module } from 'src/core/minio-s3/minio-s3.module';

@Module({
  imports: [AuthModule, StoryModule, MinioS3Module],
  controllers: [ProjectController],
  providers: [ProjectService, PrismaService],
})
export class ProjectModule {}
