import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from './schemas/story.schema';
import { MinioS3Module } from 'src/minio-s3/minio-s3.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }]),
    MinioS3Module,
  ],
  controllers: [StoryController],
  providers: [StoryService, PrismaService],
  exports: [StoryService, MongooseModule],
})
export class StoryModule {}
