import { Injectable } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService extends Client {
  constructor() {
    super({
      endPoint: process.env.MINIO_HOST || '',
      port: parseInt(process.env.MINIO_PORT || ''),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }
}
