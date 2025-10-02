import { Injectable } from '@nestjs/common';
import { subHours } from 'date-fns';
import { MinioService } from 'src/core/minio/minio.service';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async findMany() {
    const threeDaysAgo = subHours(new Date(), 60);
    const data = await this.prisma.content.findMany({
      where: { isGenerated: true, updatedAt: { gte: threeDaysAgo } },
      include: {
        contentFile: { include: { file: true } },
        contentDistribution: { select: { workgroupId: true } },
      },
    });
    const normalized = await Promise.all(
      data.map(async ({ contentDistribution, contentFile, ...item }) => ({
        ...item,
        workgroupId: contentDistribution.workgroupId,
        files: await Promise.all(
          contentFile.map(async ({ file }) => ({
            ...file,
            url: await this.minio.presignedUrl('GET', file.bucket, file.path),
          })),
        ),
      })),
    );
    return normalized;
  }
}
