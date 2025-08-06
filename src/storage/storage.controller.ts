import { Controller, Get, Post, Query } from '@nestjs/common';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('upload')
  getUploadUrl(@Query('path') path: string) {
    const data = this.storageService.getUploadUrl(path);
    return { message: 'success', data };
  }

  @Post('cleanup')
  cleanupStorage() {
    return this.storageService.cleanupStorage();
  }
}
