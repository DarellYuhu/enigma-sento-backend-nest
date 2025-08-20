import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { DownloadGroupsDto } from './dto/download-groups.dto';
import { PassThrough } from 'stream';
import slugify from 'slugify';
import archiver from 'archiver';
import { MinioService } from 'src/core/minio/minio.service';

@Injectable()
export class FolderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  create(payload: CreateFolderDto) {
    const slug = slugify(payload.name, { lower: true, strict: true });
    return this.prisma.folder.create({ data: { ...payload, slug } });
  }

  findAll() {
    return this.prisma.folder.findMany({ orderBy: { createdAt: 'desc' } });
  }

  getGeneratedGroups(folderId: string) {
    return this.prisma.generatedGroup.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  delete(id: string) {
    return this.prisma.folder.delete({ where: { id } });
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
