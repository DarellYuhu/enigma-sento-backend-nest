import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { DownloadGroupsDto } from './dto/download-groups.dto';

@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  async create(@Body() payload: CreateFolderDto) {
    try {
      return await this.folderService.create(payload);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException('Name already exist!');
      }
      throw error;
    }
  }

  @Get()
  async findAll() {
    return this.folderService.findAll();
  }

  @Get(':id/generated-groups')
  getGeneratedGroups(@Param('id') id: string) {
    return this.folderService.getGeneratedGroups(id);
  }

  @Post(':id/download')
  downloadGroup(@Param('id') id: string, @Body() payload: DownloadGroupsDto) {
    return this.folderService.downloadGroups(id, payload);
  }
}
