import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { TemplateSchema, templateSchema } from './schema/template.schema';
import { ConfigService } from '@nestjs/config';
import { S3Client } from 'bun';

@Injectable()
export class LayoutService {
  constructor(
    @Inject('S3_CLIENT') private minioS3: S3Client,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async upsert(payload: CreateLayoutDto, layoutId?: number) {
    const valid = templateSchema.safeParse(payload.template);
    if (!valid.success) {
      throw new BadRequestException(valid.error);
    }
    await Promise.all(
      valid.data.shapes.map(async (item, idx) => {
        if (!item.imagePath) return;
        const name = `${Math.floor(Math.random() * 1000000000)}-${item.imagePath.split('/').pop()}`;
        await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${item.imagePath} myminio/assets/layout/${name}`;
        const file = await this.prisma.file.create({
          data: {
            name,
            path: `/assets/layout/${name}`,
          },
        });
        valid.data.shapes[idx].imageId = file.id;
        valid.data.shapes[idx].imagePath = undefined;
      }),
    );
    if (!layoutId) {
      return await this.prisma.layout.create({
        data: {
          template: valid.data,
          creatorId: payload.creatorId,
          name: payload.name,
        },
      });
    }
    return await this.prisma.layout.update({
      where: { id: layoutId },
      data: {
        template: valid.data,
        name: payload.name,
      },
    });
  }

  async getOne(id: number) {
    const layout = await this.prisma.layout.findUnique({ where: { id } });
    const shapes = await Promise.all(
      (layout.template as TemplateSchema).shapes.map(async (item) => {
        if (item.imageId) {
          const file = await this.prisma.file.findUnique({
            where: { id: item.imageId },
          });
          item.imageUrl = this.minioS3.presign(file.path, { method: 'GET' });
        }
        return item;
      }),
    );

    (layout.template as TemplateSchema).shapes = shapes;
    return layout;
  }

  getAll() {
    return this.prisma.layout.findMany({
      include: {
        creator: {
          select: {
            displayName: true,
          },
        },
      },
    });
  }
}
