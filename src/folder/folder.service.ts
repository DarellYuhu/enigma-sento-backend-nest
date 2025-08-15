import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import slugify from 'slugify';
import { DownloadGroupsDto } from './dto/download-groups.dto';
import archiver from 'archiver';
import * as minio from 'minio';
import { PassThrough } from 'stream';

@Injectable()
export class FolderService {
  private readonly minio = new minio.Client({
    endPoint: process.env.MINIO_HOST || '',
    port: parseInt(process.env.MINIO_PORT || ''),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateFolderDto) {
    const slug = slugify(payload.name, { lower: true, strict: true });
    return this.prisma.folder.create({ data: { ...payload, slug } });
  }

  findAll() {
    return this.prisma.folder.findMany({ orderBy: { createdAt: 'desc' } });
  }

  getGeneratedGroups(folderId: string) {
    return this.prisma.generatedGroup.findMany({ where: { folderId } });
  }

  async downloadGroups(folderId: string, payload: DownloadGroupsDto) {
    const generatedGroup = await this.prisma.generatedGroup
      .findUniqueOrThrow({
        where: { id: payload.generatedGroup, folderId },
      })
      .catch(() => {
        throw new NotFoundException('Generated group not found!');
      });
    const validGroup = payload.groups.filter((group) =>
      generatedGroup.groups.includes(group),
    );
    const folderPrefix = `folder/${folderId}/${generatedGroup.name}`;
    const fileList = (
      await Promise.all(
        validGroup.map(
          async (group) =>
            await this.listFolder(
              'generated-content',
              `${folderPrefix}/${group}`,
            ),
        ),
      )
    ).flat();
    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(passThrough);
    for (const file of fileList) {
      const object = await this.minio.getObject('generated-content', file);
      archive.append(object, { name: file.replace(folderPrefix, '') });
    }
    archive.finalize();
    const zipDest = `archives/${generatedGroup.name}/${Date.now()}-download.zip`;
    await this.minio.putObject('tmp', zipDest, passThrough);
    return this.minio.presignedGetObject('tmp', zipDest);
  }

  private async listFolder(bucket: string, folder: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const objectsStream = this.minio.listObjects(bucket, folder + '/', true);
      const keys: string[] = [];
      objectsStream.on('data', (obj) => keys.push(obj.name!));
      objectsStream.on('error', reject);
      objectsStream.on('end', () => resolve(keys));
    });
  }
}
