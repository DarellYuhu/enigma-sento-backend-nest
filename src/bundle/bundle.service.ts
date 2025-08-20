import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createWriteStream } from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { subDays } from 'date-fns';
import pLimit from 'p-limit';
import { MinioService } from 'src/core/minio/minio.service';

@Injectable()
export class BundleService {
  private readonly NODE_ENV = process.env.NODE_ENV;
  private readonly MINIO_CLI = process.env.MINIO_CLIENT_COMMAND;
  private readonly logger = new Logger(BundleService.name);
  constructor(
    private readonly scheduler: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  findAll({ folderId }: { folderId?: string }) {
    return this.prisma.bundle.findMany({
      where: { folderId },
      include: { _count: { select: { bundleFile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, payload: UpdateBundleDto) {
    return this.prisma.bundle.update({ where: { id }, data: payload });
  }

  async findById(id: string) {
    const data = await this.prisma.bundle
      .findUniqueOrThrow({
        where: { id },
        include: { bundleFile: { select: { file: true } } },
      })
      .catch(() => {
        throw new NotFoundException('Bundle not found!');
      });
    const normalized = {
      ...data,
      bundleFile: await Promise.all(
        data.bundleFile.map(async (b) => ({
          ...b.file,
          url: await this.minio.presignedGetObject(b.file.path, b.file.bucket),
        })),
      ),
    };
    return normalized;
  }

  async groupAndDownload(
    bundleIds: string[],
    keys: { count?: number; groupKeys?: string[] },
  ) {
    const count = keys.groupKeys ? keys.groupKeys.length : keys.count!;
    const groupKeys =
      keys.groupKeys ||
      Array.from({ length: keys.count! }).map((_, idx) => (idx + 1).toString());
    const bundles = await this.prisma.bundle.findMany({
      where: { id: { in: bundleIds } },
      include: { bundleFile: { select: { file: true } }, captionFile: true },
    });
    const files = bundles.flatMap((bundle) =>
      bundle.bundleFile.map((f) => ({ ...f.file, bundleName: bundle.name })),
    );
    const captions = (
      await Promise.all(
        bundles
          .filter((bundle) => bundle.captionFile)
          .map(async (bundle) => {
            const stream = await this.minio.getObject(
              bundle.captionFile!.bucket,
              bundle.captionFile!.path,
            );
            const buf = (
              await new Response(stream as unknown as ReadableStream).text()
            ).split('\n');
            return buf;
          }),
      )
    ).flat();
    const groupedCaptions = new Map<string, string[]>();
    captions.forEach((caption, idx) => {
      const group = groupKeys[idx % count];
      if (groupedCaptions.has(group)) groupedCaptions.get(group)?.push(caption);
      else groupedCaptions.set(group, [caption]);
    });

    const folderId = bundles[0].folderId;
    const date = new Date().getTime();
    const limit = pLimit(25);
    const putCaptions = Array.from(groupedCaptions).map(([key, val]) =>
      limit(() =>
        this.minio.putObject(
          'generated-content',
          `folder/${folderId}/${date}/${key}/captions.txt`,
          val.join('\n'),
        ),
      ),
    );
    const putImages = files.map(async (file, idx) => {
      limit(
        () =>
          Bun.$`${this.MINIO_CLI} cp myminio/${file.fullPath} myminio/generated-content/folder/${folderId}/${date}/${groupKeys[idx % count]}/${file.bundleName}-${file.name}`,
      );
    });
    await Promise.all([...putCaptions, ...putImages]);
    if (keys.groupKeys) {
      await this.prisma.generatedGroup.create({
        data: { name: date.toString(), folderId, groups: groupKeys },
      });
    } else {
      await Bun.$`${this.MINIO_CLI} cp --recursive myminio/generated-content/folder/${folderId}/${date} ./tmp/`;
      const folderPath = path.join(__dirname, `../../tmp/${date}`);
      const zipPath = path.join(__dirname, `../../tmp/${date}.zip`);

      // Step 1: Create zip and save to disk
      await new Promise<void>((resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(folderPath, false);
        archive.finalize();
      });
      return { zipPath, folderPath };
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'bundle-cleanup-scheduler',
  })
  async bundleCleanupScheduler() {
    if (this.NODE_ENV === 'development')
      this.scheduler.deleteCronJob('bundle-cleanup-scheduler');
    const threeDaysAgo = subDays(new Date(), 2);
    const bundles = await this.prisma.bundle.findMany({
      select: {
        id: true,
        captionFile: true,
        bundleFile: { select: { file: true } },
      },
      where: { createdAt: { lt: threeDaysAgo } },
    });
    await this.minio.removeObjects(
      'generated-content',
      bundles.flatMap((bundle) => {
        const files = bundle.bundleFile.map(({ file }) => file.path);
        if (bundle.captionFile) files.push(bundle.captionFile.path);
        return files;
      }),
    );
    const deleteFiles = this.prisma.file.deleteMany({
      where: {
        OR: [
          {
            bundleFile: {
              some: { bundleId: { in: bundles.map((bundle) => bundle.id) } },
            },
          },
          {
            Bundle: {
              some: { id: { in: bundles.map((bundle) => bundle.id) } },
            },
          },
        ],
      },
    });
    const deleteBundles = this.prisma.bundle.deleteMany({
      where: { id: { in: bundles.map((bundle) => bundle.id) } },
    });
    await this.prisma.$transaction([deleteFiles, deleteBundles]);
    this.logger.log('Bundle cleanup successfully 🎉');
  }
}
