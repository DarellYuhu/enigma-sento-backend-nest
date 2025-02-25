import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateGroupDistributionDto,
  XlsxFileSchema,
} from './dto/create-group-distribution.dto';
import { UpdateGroupDistributionDto } from './dto/update-group-distribution.dto';
import * as xlsx from 'xlsx';
import { PrismaService } from 'src/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class GroupDistributionService {
  constructor(private readonly prisma: PrismaService) {}

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
}
