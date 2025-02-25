import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from 'bun';

@Injectable()
export class StorageService {
  constructor(@Inject('S3_CLIENT') private minioS3: S3Client) {}

  getUploadUrl(path: string) {
    return this.minioS3.presign(path, { bucket: 'tmp', method: 'PUT' });
  }
}
