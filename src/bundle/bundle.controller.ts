import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BundleService } from './bundle.service';
import {
  downloadBundleSchema,
  type DownloadBundleDto,
} from './dto/download-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { parseXlsxToObject } from 'src/core/utils';
import { validXlsxSchema } from './dto/valid-xlsx.schema';
import { createReadStream, rmSync } from 'fs';

@Controller('bundles')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  @Get()
  findAll(@Query('folder_id') folderId?: string) {
    return this.bundleService.findAll({ folderId });
  }

  @Post('download')
  @UseInterceptors(FileInterceptor('groupKeys'))
  async groupAndDownload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: false }),
    )
    file: Express.Multer.File,
    @Body() payload: DownloadBundleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = downloadBundleSchema.parse({ ...payload, groupKeys: file });
    let keys: string[] | undefined;
    if (parsed.groupKeys) {
      const parsedXlsx = parsed.groupKeys.buffer
        ? parseXlsxToObject(parsed.groupKeys.buffer)
        : undefined;
      const validSchema = await validXlsxSchema.parseAsync(parsedXlsx);
      keys = validSchema;
    }
    const data = await this.bundleService.groupAndDownload(payload.bundleIds, {
      count: payload.count,
      groupKeys: keys,
    });
    if (!data) return;
    res.on('finish', () => {
      try {
        rmSync(data.zipPath, { force: true });
        rmSync(data.folderPath, { recursive: true, force: true });
        console.log('Temp files deleted.');
      } catch (err) {
        console.error('Cleanup failed:', err);
      }
    });
    const fileStream = createReadStream(data.zipPath);
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
