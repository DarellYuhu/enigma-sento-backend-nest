import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async findMany() {
    return this.contentService.findMany();
  }
}
