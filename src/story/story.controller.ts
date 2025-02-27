import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateSectionRequestDto } from './dto/updateSection-story.dto';
import { UpdateStoryRequestDto } from './dto/update-story.dot';
import { AddGeneratedContentDto } from './dto/add-generated-content.dto';

@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  async create(@Body() createStoryDto: CreateStoryDto) {
    const data = await this.storyService.create(createStoryDto);
    return { message: 'success', data };
  }

  @Get()
  findAll() {
    return this.storyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storyService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storyService.remove(+id);
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

  @Patch(':id/sections/:sectionId')
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionRequestDto,
  ) {
    return this.storyService.updateSection(id, sectionId, updateSectionDto);
  }
}
