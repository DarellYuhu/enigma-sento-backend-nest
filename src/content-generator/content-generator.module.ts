import { forwardRef, Module } from '@nestjs/common';
import { ContentGeneratorService } from './content-generator.service';
import { ContentGeneratorController } from './content-generator.controller';
import { BullModule } from '@nestjs/bullmq';
import { MinioS3Module } from 'src/minio-s3/minio-s3.module';
import { ContentGeneratorConsumer } from './content-generator.consumer';
import { StoryModule } from 'src/story/story.module';

@Module({
  imports: [
    StoryModule,
    BullModule.registerQueue({ name: 'script-queue' }),
    MinioS3Module,
  ],
  controllers: [ContentGeneratorController],
  providers: [ContentGeneratorService, ContentGeneratorConsumer],
  exports: [BullModule],
})
export class ContentGeneratorModule {}
