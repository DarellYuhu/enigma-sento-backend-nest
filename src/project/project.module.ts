import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthModule } from 'src/auth/auth.module';
import { StoryModule } from 'src/story/story.module';

@Module({
  imports: [AuthModule, StoryModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
