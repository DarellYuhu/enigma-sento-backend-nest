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
import { ApiBody } from '@nestjs/swagger';
import { CreateGroupDistributionDto } from './dto/create-group-distribution.dto';

@Controller('workgroup/:workgroupId/group-distribution')
export class GroupDistributionController {
  constructor(
    private readonly groupDistributionService: GroupDistributionService,
  ) {}

  @Post()
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
  remove(@Param('id') id: string) {
    return this.groupDistributionService.remove(+id);
  }
}
