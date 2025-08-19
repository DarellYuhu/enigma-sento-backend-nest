import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateSectionRequestDto } from './dto/updateSection-story.dto';
import { UpdateStoryRequestDto } from './dto/update-story.dot';
import { AddGeneratedContentDto } from './dto/add-generated-content.dto';
import { AddContentWithSectionSchema } from './dto/add-content-with-section.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { AddContentWithSectionDto } from './dto/add-content-with-section.dto';

@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  async create(@Body() createStoryDto: CreateStoryDto) {
    const data = await this.storyService.create(createStoryDto);
    return { message: 'success', data };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storyService.remove(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryRequestDto,
  ) {
    return this.storyService.update(id, updateStoryDto);
  }

  @Post(':id/generate')
  generate(@Param('id') id: string, @Query('withMusic') withMusic: boolean) {
    return this.storyService.generate(id, withMusic);
  }

  @Post(':id/generated-content')
  addGeneratedContent(
    @Param('id') id: string,
    @Body() addGeneratedContentDto: AddGeneratedContentDto,
  ) {
    return this.storyService.addGeneratedContent(id, addGeneratedContentDto);
  }

  @Post(':id/generated-content-with-seciton')
  @UseInterceptors(AnyFilesInterceptor())
  async addContentWithSection(
    @Param('id') id: string,
    @Body() payload: AddContentWithSectionDto,
    @UploadedFiles() uploadedFiles: Express.Multer.File[],
  ) {
    const files = uploadedFiles.reduce<Record<string, Express.Multer.File[]>>(
      (acc, file) => {
        const match = file.fieldname.match(/^files\[(.+?)\]\[\d+\]$/);
        if (!match) return acc;
        const section = match[1];
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(file);
        return acc;
      },
      {},
    );
    const valid = AddContentWithSectionSchema.parse({
      ...payload,
      contentPerStory: +payload.contentPerStory,
      files,
    });
    await this.storyService.addContentWithSection(id, valid);
  }

  @Patch(':id/sections/:sectionId')
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionRequestDto,
  ) {
    return this.storyService.updateSection(id, sectionId, updateSectionDto);
  }
}
