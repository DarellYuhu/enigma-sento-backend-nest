import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateGroupDistributionDto,
  XlsxFileSchema,
} from './dto/create-group-distribution.dto';
import { UpdateGroupDistributionDto } from './dto/update-group-distribution.dto';
import * as xlsx from 'xlsx';
import { PrismaService } from 'src/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { S3Client } from 'bun';
import { DownloadGroupDistributionDto } from './dto/download-group-distribution.dto';

@Injectable()
export class GroupDistributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject('S3_CLIENT') private minioS3: S3Client,
  ) {}

  async create(payload: CreateGroupDistributionDto, workgroupId: string) {
    const buffer = payload.file.buffer;
    const workbook = xlsx.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = xlsx.utils.sheet_to_json(worksheet);
    const instance = plainToInstance(XlsxFileSchema, { data: parsed });
    const errors = await validate(instance);
    if (errors.length > 0) throw new BadRequestException('Invalid model');

    return this.prisma.groupDistribution.createManyAndReturn({
      data: instance.data.map((item) => ({ ...item, workgroupId })),
    });
  }

  findAll() {
    return `This action returns all groupDistribution`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupDistribution`;
  }

  update(id: number, updateGroupDistributionDto: UpdateGroupDistributionDto) {
    return `This action updates a #${id} groupDistribution`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupDistribution`;
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
    await this.minioS3.write(filename, await file.arrayBuffer(), {
      bucket: 'tmp',
    });
    await Bun.$`rm -rf ${basePath}/`;

    return this.minioS3.presign(filename, {
      bucket: 'tmp',
      method: 'GET',
    });
  }
}
