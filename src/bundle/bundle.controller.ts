import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { BundleService } from './bundle.service';
import { DownloadBundleDto } from './dto/download-bundle.dto';
import { createReadStream, rmSync } from 'fs';
import type { Response } from 'express';

@Controller('bundles')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  @Get()
  findAll(@Query('folder_id') folderId?: string) {
    return this.bundleService.findAll({ folderId });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bundleService.findById(id);
  }

  @Post('download')
  async groupAndDownload(
    @Body() payload: DownloadBundleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { zipPath, folderPath } = await this.bundleService.groupAndDownload(
      payload.bundleIds,
      payload.count,
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
}
