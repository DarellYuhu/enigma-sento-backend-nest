import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { LayoutGroupService } from './layout-group.service';
import { CreateLayoutGroupDto } from './dto/create-layout-group.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('layout-groups')
export class LayoutGroupController {
  constructor(private readonly layoutGroupService: LayoutGroupService) {}

  @Post()
  create(@Body() payload: CreateLayoutGroupDto) {
    return this.layoutGroupService.create(payload);
  }

  @Get()
  findAll() {
    return this.layoutGroupService.findAll();
  }

  @Post(':id/generate-contents')
  @UseInterceptors(AnyFilesInterceptor())
  async generateContent(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() payload: Record<string, string>,
    @Param('id') id: string,
    @Query('total') total?: string,
  ) {
    const map = new Map<string, string | string[]>();
    for (const [key, value] of Object.entries(payload)) {
      map.set(key, value);
    }
    for (const file of files) {
      const buf = Buffer.from(file.buffer);
      const text = buf.toString().split('\n');
      map.set(file.fieldname, text);
    }

    const data = await this.layoutGroupService.generateContent(+id, map, total);

    return new StreamableFile(data, {
      type: 'application/zip',
      disposition: 'attachment; filename=generated-result.zip',
    });
  }

  @Get(':id/variable-fields')
  getVariableFields(@Param('id') id: string) {
    return this.layoutGroupService.getVariableFields(+id);
  }
}
