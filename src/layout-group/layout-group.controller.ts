import { Body, Controller, Post } from '@nestjs/common';
import { LayoutGroupService } from './layout-group.service';
import { CreateLayoutGroupDto } from './dto/create-layout-group.dto';

@Controller('layout-groups')
export class LayoutGroupController {
  constructor(private readonly layoutGroupService: LayoutGroupService) {}

  @Post()
  create(@Body() payload: CreateLayoutGroupDto) {
    return this.layoutGroupService.create(payload);
  }
}
