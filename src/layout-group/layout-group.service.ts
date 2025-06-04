import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateLayoutGroupDto } from './dto/create-layout-group.dto';

@Injectable()
export class LayoutGroupService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateLayoutGroupDto) {
    return this.prisma.layoutGroup.create({
      data: {
        name: payload.name,
        description: payload.description,
        groupItem: {
          createMany: {
            data: payload.layoutIds.map((layoutId) => ({ layoutId })),
          },
        },
      },
    });
  }
}
