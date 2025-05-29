import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { CreateLayoutDto } from './dto/create-layout.dto';

@Controller('layouts')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Post()
  async create(@Body() createLayoutDto: CreateLayoutDto) {
    const data = await this.layoutService.upsert(createLayoutDto);
    return { message: 'success', data };
  }

  @Get()
  getAll() {
    return this.layoutService.getAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.layoutService.getOne(+id);
  }

  @Patch(':id')
  async update(
    @Body() updateLayoutDto: CreateLayoutDto,
    @Param('id') id: string,
  ) {
    const data = await this.layoutService.upsert(updateLayoutDto, +id);
    return { message: 'success', data };
  }
}
