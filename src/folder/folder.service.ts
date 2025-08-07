import { Injectable } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class FolderService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateFolderDto) {
    const slug = slugify(payload.name, { lower: true, strict: true });
    return this.prisma.folder.create({ data: { ...payload, slug } });
  }

  findAll() {
    return this.prisma.folder.findMany();
  }
}
