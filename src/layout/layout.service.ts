import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { S3Client } from 'bun';
import {
  Shape,
  TemplateSchema,
  templateSchema,
} from './schema/template.schema';
import {
  createCanvas,
  deregisterAllFonts,
  loadImage,
  registerFont,
  type CanvasRenderingContext2D,
} from 'canvas';
import { AssetService } from 'src/asset/asset.service';
import { FieldConfig } from 'types';

@Injectable()
export class LayoutService {
  constructor(
    @Inject('S3_CLIENT') private minioS3: S3Client,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly asset: AssetService,
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

  getAll(groupId?: number) {
    return this.prisma.layout.findMany({
      where: {
        groupItem: groupId && { some: { layoutGroupId: groupId } },
      },
      include: {
        creator: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  delete(id: number) {
    return this.prisma.layout.delete({ where: { id } });
  }

  async generateImage(
    layoutId: number,
    config?: { templateConfig: FieldConfig[]; idx: number },
  ) {
    const layout = await this.getOne(layoutId);
    const template = layout.template as TemplateSchema;

    if (config.templateConfig) {
      for (const shape of template.shapes) {
        for (const field of config.templateConfig) {
          if (shape.key === field.key && !shape[field.targetField]) {
            shape[field.targetField] =
              field.value[config.idx % field.value.length];
          }
        }
      }
    }

    const targetDir = Math.floor(Math.random() * 1000000000).toString();

    for (const shape of template.shapes.filter((shape) => shape.fontId)) {
      await this.loadFont(shape.fontId, shape.key, targetDir);
    }

    const canvas = createCanvas(
      template.dimensions.width,
      template.dimensions.height,
    );
    const ctx = canvas.getContext('2d');
    ctx.quality = 'best';
    ctx.patternQuality = 'best';
    for (const box of template.shapes) {
      ctx.save();
      ctx.translate(box.x + box.width / 2, box.y + box.height / 2);
      ctx.rotate(((box.rotation || 0) * Math.PI) / 180);
      ctx.translate(-box.width / 2, -box.height / 2);
      ctx.fillStyle = box.fill || 'transparent';
      switch (box.type) {
        case 'text':
          const text = box.value ? box.value : box.key;
          ctx.fillStyle = box.fill || 'black';
          this.drawTextFit(box, text, ctx);
          break;
        case 'rectangle':
          ctx.fillRect(0, 0, box.width, box.height);
          if (box.imageUrl) {
            await this.handleImageRender(box, ctx);
          }
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(box.width / 2, box.height / 2, box.width / 2, 0, 2 * Math.PI);
          ctx.fill();
          if (box.imageUrl) {
            ctx.save();
            ctx.clip();
            await this.handleImageRender(box, ctx);
            ctx.restore();
          }
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(box.width / 2, 0);
          ctx.lineTo(0, box.height);
          ctx.lineTo(box.width, box.height);
          ctx.fill();
          if (box.imageUrl) {
            ctx.save();
            ctx.clip();
            ctx.beginPath();
            ctx.moveTo(box.width / 2, 0);
            ctx.lineTo(0, box.height);
            ctx.lineTo(box.width, box.height);
            ctx.clip();
            await this.handleImageRender(box, ctx);
            ctx.restore();
          }
          break;
        default:
          ctx.strokeRect(0, 0, box.width, box.height);
      }
      ctx.restore();
    }
    deregisterAllFonts();
    await Bun.$`rm -rf ${process.cwd()}/tmp/font/${targetDir}/`;
    return canvas.toBuffer('image/png');
  }

  private async drawTextFit(
    box: Shape,
    text: string,
    ctx: CanvasRenderingContext2D,
  ) {
    let fontSize = 30;
    const padding = 5;
    const maxWidth = box.width - padding * 2;
    const maxHeight = box.height - padding * 2;
    const fontFam = box.fontId ? `font-${box.key}` : 'sans-serif';
    ctx.textBaseline = 'top';

    // Kurangi fontSize sampai semua baris cukup lebar dan tinggi
    while (fontSize > 5) {
      ctx.font = `${fontSize}px ${fontFam}`;
      const lines = this.wrapText(text, maxWidth, ctx);
      const totalHeight = lines.length * fontSize;

      if (totalHeight <= maxHeight) {
        break;
      }
      fontSize--;
    }

    ctx.font = `${fontSize}px ${fontFam}`;
    const lines = this.wrapText(text, maxWidth, ctx);
    let startY = padding;

    switch (box.align) {
      case 'center':
        ctx.textAlign = 'center';
        break;
      case 'right':
        ctx.textAlign = 'right';
        break;
      default:
        ctx.textAlign = 'left';
        break;
    }

    lines.forEach((line) => {
      if (startY + fontSize > maxHeight + padding) return; // Jangan gambar jika melebihi box
      let x: number;
      if (box.align === 'center') {
        x = box.width / 2;
      } else if (box.align === 'right') {
        x = box.width - padding;
      } else {
        x = padding;
      }
      ctx.fillText(line, x, startY);
      startY += fontSize;
    });
  }

  private wrapText(
    text: string,
    maxWidth: number,
    ctx: CanvasRenderingContext2D,
  ) {
    const words = text.split(' ');
    const lines = [];
    let line = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? ' ' : '') + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private async loadFont(id: string, key: string, targetDir: string) {
    const font = await this.asset.getFontById(id);
    const path = `./tmp/font/${targetDir}/${font.name}`;
    await Bun.$`${process.env.MINIO_CLIENT_COMMAND} cp myminio/${font.path} ${path}`;
    registerFont(path, { family: `font-${key}` });
  }

  private async handleImageRender(box: Shape, ctx: CanvasRenderingContext2D) {
    const img = await loadImage(box.imageUrl);
    ctx.drawImage(img, 0, 0, box.width, box.height);
  }
}
