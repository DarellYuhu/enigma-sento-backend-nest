import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from './schemas/story.schema';
import { AssetModule } from 'src/asset/asset.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    AssetModule,
    BullModule.registerQueue({ name: 'script-queue' }),
    MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }]),
  ],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService, MongooseModule],
})
export class StoryModule {}
