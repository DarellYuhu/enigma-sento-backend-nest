import { Controller } from '@nestjs/common';
import { ContentGeneratorService } from './content-generator.service';

@Controller('content-generator')
export class ContentGeneratorController {
  constructor(
    private readonly contentGeneratorService: ContentGeneratorService,
  ) {}
}
