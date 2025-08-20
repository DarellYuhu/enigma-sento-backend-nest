import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { isBefore, subDays } from 'date-fns';
import { MinioService } from 'src/core/minio/minio.service';

@Injectable()
export class StorageService {
  private readonly NODE_ENV = process.env.NODE_ENV;
  private readonly logger = new Logger(StorageService.name);
  constructor(
    private readonly minio: MinioService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  getUploadUrl(path: string) {
    return this.minio.presignedPutObject('tmp', path);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'cleanup-storage-scheduler',
  })
  async cleanupStorage() {
    if (this.NODE_ENV === 'development')
      this.scheduler.deleteCronJob('cleanup-storage-scheduler');

    const oneWeekAgo = subDays(new Date(), 5);
    const tmpObjects: string[] = [];
    const generatedObjects: string[] = [];

    const tmpStreamPromise = new Promise<void>((resolve, reject) => {
      const stream = this.minio.listObjectsV2('tmp', '', true);
      stream.on('data', (obj) => {
        tmpObjects.push(obj.name!);
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    const generatedStreamPromise = new Promise<void>((resolve, reject) => {
      const stream = this.minio.listObjectsV2('generated-content', '', true);
      stream.on('data', (obj) => {
        if (isBefore(obj.lastModified!, oneWeekAgo)) {
          generatedObjects.push(obj.name!);
        }
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    await Promise.all([tmpStreamPromise, generatedStreamPromise]);
    await this.minio.removeObjects('tmp', tmpObjects);
    await this.minio.removeObjects('generated-content', generatedObjects);

    this.logger.log('✅ Cleanup scheduler finished succesfully');
  }
}
