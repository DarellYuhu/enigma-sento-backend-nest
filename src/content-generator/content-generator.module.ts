import { Module } from '@nestjs/common';
import { ContentGeneratorService } from './content-generator.service';
import { ContentGeneratorController } from './content-generator.controller';
import { BullModule } from '@nestjs/bullmq';
import { ContentGeneratorConsumer } from './content-generator.consumer';
import { StoryModule } from 'src/story/story.module';

@Module({
  imports: [StoryModule, BullModule.registerQueue({ name: 'script-queue' })],
  controllers: [ContentGeneratorController],
  providers: [ContentGeneratorService, ContentGeneratorConsumer],
  exports: [BullModule],
})
export class ContentGeneratorModule {}
