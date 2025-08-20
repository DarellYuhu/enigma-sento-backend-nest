import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { LayoutService } from './layout.service';
import { UpsertLayoutDto } from './dto/upsert-layout.dto';
import { GetLayoutQueryDto } from './dto/get-layout.dto';

@Controller('layouts')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Post()
  async create(@Body() payload: UpsertLayoutDto) {
    const data = await this.layoutService.upsert(payload);
    return { message: 'success', data };
  }

  @Get()
  getAll(@Query() query: GetLayoutQueryDto) {
    console.log(query);
    return this.layoutService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.layoutService.getOne(+id);
  }

  @Patch(':id')
  async update(@Body() payload: UpsertLayoutDto, @Param('id') id: string) {
    const data = await this.layoutService.upsert(payload, +id);
    return { message: 'success', data };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.layoutService.delete(+id);
  }

  @Post(':id/generate-images')
  async generateImage(@Param('id') id: string) {
    const data = await this.layoutService.generateImage(+id);
    return new StreamableFile(data, {
      type: 'image/png',
      disposition: 'attachment; filename=layout.png',
    });
  }
}
