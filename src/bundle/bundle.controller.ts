import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UsePipes,
} from '@nestjs/common';
import { BundleService } from './bundle.service';
import { downloadBundleSchema } from './dto/download-bundle.dto';
import { createReadStream, rmSync } from 'fs';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { ZodValidationPipe } from 'src/validation/zodValidation.pipe';
import type { Response } from 'express';
import type { DownloadBundleDto } from './dto/download-bundle.dto';

@Controller('bundles')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  @Get()
  findAll(@Query('folder_id') folderId?: string) {
    return this.bundleService.findAll({ folderId });
  }

  @Post('download')
  @UsePipes(new ZodValidationPipe(downloadBundleSchema))
  async groupAndDownload(
    @Body() payload: DownloadBundleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { zipPath, folderPath } = await this.bundleService.groupAndDownload(
      payload.bundleIds,
      { count: payload.count, groupKeys: payload.groupKeys },
    );
    res.on('finish', () => {
      try {
        rmSync(zipPath, { force: true });
        rmSync(folderPath, { recursive: true, force: true });
        console.log('Temp files deleted.');
      } catch (err) {
        console.error('Cleanup failed:', err);
      }
    });
    const fileStream = createReadStream(zipPath);
    return new StreamableFile(fileStream, {
      type: 'application/zip',
      disposition: 'attachment; filename="grouped-contents.zip"',
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bundleService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateBundleDto) {
    return this.bundleService.update(id, payload);
  }
}
