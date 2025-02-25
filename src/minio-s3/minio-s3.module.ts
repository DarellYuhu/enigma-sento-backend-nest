import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const S3ClientProvider: Provider = {
  provide: 'S3_CLIENT',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Bun.S3Client({
      endpoint: `http://${config.get('MINIO_HOST')}:${config.get('MINIO_PORT')}`,
      accessKeyId: config.get('MINIO_ACCESS_KEY'),
      secretAccessKey: config.get('MINIO_SECRET_KEY'),
    });
  },
};

@Module({
  providers: [S3ClientProvider],
  exports: ['S3_CLIENT'],
})
export class MinioS3Module {}
