import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { GroupDistributionService } from './group-distribution.service';
import { UpdateGroupDistributionDto } from './dto/update-group-distribution.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateGroupDistributionDto } from './dto/create-group-distribution.dto';
import { DownloadGroupDistributionDto } from './dto/download-group-distribution.dto';

@Controller('workgroups/:workgroupId/group-distributions')
export class GroupDistributionController {
  constructor(
    private readonly groupDistributionService: GroupDistributionService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateGroupDistributionDto })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Param('workgroupId') id: string,
  ) {
    return this.groupDistributionService.create({ file }, id);
  }

  @Get()
  findAll() {
    return this.groupDistributionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupDistributionService.findOne(+id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateGroupDistributionDto })
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateGroupDistributionDto: UpdateGroupDistributionDto,
  ) {
    return this.groupDistributionService.update(
      +id,
      updateGroupDistributionDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.groupDistributionService.remove(id);
    return { message: 'success', data };
  }

  @Post(':id/download')
  async downloadContents(
    @Param('id') id: string,
    @Body() downloadGroupDistributionDto: DownloadGroupDistributionDto,
  ) {
    const data = await this.groupDistributionService.downloadContents(
      id,
      downloadGroupDistributionDto,
    );
    return { message: 'success', data };
  }
}
