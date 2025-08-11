import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from 'bun';
import { createWriteStream } from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import * as minio from 'minio';

@Injectable()
export class BundleService {
  private readonly MINIO_CLI = process.env.MINIO_CLIENT_COMMAND;
  private readonly minio = new minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: parseInt(process.env.MINIO_PORT as string | undefined),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
  constructor(
    private readonly prisma: PrismaService,
    @Inject('S3_CLIENT') private readonly minioS3: S3Client,
  ) {}

  findAll({ folderId }: { folderId?: string }) {
    return this.prisma.bundle.findMany({ where: { folderId } });
  }

  update(id: string, payload: UpdateBundleDto) {
    return this.prisma.bundle.update({ where: { id }, data: payload });
  }

  async findById(id: string) {
    const data = await this.prisma.bundle.findUnique({
      where: { id },
      include: { bundleFile: { select: { file: true } } },
    });
    const normalized = {
      ...data,
      bundleFile: data.bundleFile.map((b) => ({
        ...b.file,
        url: this.minioS3.presign(b.file.fullPath),
      })),
    };
    return normalized;
  }

  async groupAndDownload(bundleIds: string[], count: number) {
    const bundles = await this.prisma.bundle.findMany({
      where: { id: { in: bundleIds } },
      include: { bundleFile: { select: { file: true } }, captionFile: true },
    });
    const files = bundles.flatMap((bundle) =>
      bundle.bundleFile.map((f) => ({ ...f.file, bundleName: bundle.name })),
    );
    const captions = await Promise.all(
      bundles
        .filter((bundle) => bundle.captionFile)
        .map(async (bundle) => {
          const stream = await this.minio.getObject(
            bundle.captionFile.bucket,
            bundle.captionFile.path,
          );
          const buf = (await new Response(stream).text()).split('\n');
          return buf;
        }),
    );
    const groupedCaptions = new Map<string, string[]>();
    captions.flat().forEach((caption, idx) => {
      const group = ((idx % count) + 1).toString();
      if (groupedCaptions.has(group)) groupedCaptions.get(group).push(caption);
      else groupedCaptions.set(group, [caption]);
    });

    const folderName = bundles[0].folderId;
    const date = new Date().getTime();
    const putCaptions = Array.from(groupedCaptions).map(([key, val]) =>
      this.minio.putObject(
        'generated-content',
        `folder/${folderName}/${date}/${key}/captions.txt`,
        val.join('\n'),
      ),
    );
    const putImages = files.map(async (file, idx) => {
      await Bun.$`${this.MINIO_CLI} cp myminio/${file.fullPath} myminio/generated-content/folder/${folderName}/${date}/${(idx % count) + 1}/${file.bundleName}-${file.name}`;
    });
    await Promise.all([putCaptions, putImages]);
    await Bun.$`${this.MINIO_CLI} cp --recursive myminio/generated-content/folder/${folderName}/${date} ./tmp/`;
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
