import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateGroupDistributionDto,
  XlsxFileSchema,
} from './dto/create-group-distribution.dto';
import * as xlsx from 'xlsx';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { DownloadGroupDistributionDto } from './dto/download-group-distribution.dto';
import { MinioService } from 'src/core/minio/minio.service';

@Injectable()
export class GroupDistributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly minio: MinioService,
  ) {}

  async create(payload: CreateGroupDistributionDto, workgroupId: string) {
    const buffer = payload.file.buffer;
    const workbook = xlsx.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = xlsx.utils.sheet_to_json(worksheet);
    const instance = plainToInstance(XlsxFileSchema, { data: parsed });
    const errors = await validate(instance);
    if (errors.length > 0) throw new BadRequestException('Invalid model');

    return await this.prisma.$transaction(
      instance.data.map((item) =>
        this.prisma.groupDistribution.upsert({
          create: { ...item, workgroupId },
          update: { isDeleted: false, amontOfTroops: item.amontOfTroops },
          where: {
            code_workgroupId: {
              code: item.code,
              workgroupId,
            },
          },
        }),
      ),
    );
  }

  remove(id: string) {
    return this.prisma.groupDistribution.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async downloadContents(id: string, payload: DownloadGroupDistributionDto) {
    const groupDistribution = await this.prisma.groupDistribution.findUnique({
      where: { id },
      include: {
        Workgroup: {
          select: { Project: { where: { id: { in: payload.projectIds } } } },
        },
      },
    });

    if (!groupDistribution)
      throw new NotFoundException('Group distribution not found');

    const basePath = `${process.cwd()}/tmp/download`;

    await Promise.all(
      groupDistribution.Workgroup.Project.map(async ({ name }) => {
        await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} cp --recursive myminio/generated-content/${groupDistribution.code}/${name} ${basePath}/${groupDistribution.code}`.catch(
          () => {
            throw new NotFoundException("Story's contents not found");
          },
        );
      }),
    );
    const filename = `${groupDistribution.code}_${format(
      new Date(),
      'yyyy-MM-dd',
    )}.tar.gz`;
    const path = `${basePath}/${filename}`;
    await Bun.$`tar -czf ${path} -C ${basePath} ${groupDistribution.code}`;
    const file = Bun.file(`${path}`);
    await this.minio.putObject(
      'tmp',
      filename,
      Buffer.from(await file.arrayBuffer()),
    );
    await Bun.$`rm -rf ${basePath}/`;
    return await this.minio.presignedUrl('GET', 'tmp', filename);
  }
}
