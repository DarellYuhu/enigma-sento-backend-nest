import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { templateSchema } from './schema/template.schema';

@Injectable()
export class LayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(payload: CreateLayoutDto, layoutId?: number) {
    const valid = templateSchema.safeParse(payload.template);
    if (!valid.success) {
      throw new BadRequestException(valid.error);
    }
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
}
