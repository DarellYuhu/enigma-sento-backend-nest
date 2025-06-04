import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLayoutGroupDto implements Prisma.LayoutGroupCreateInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({}, { each: true })
  @IsArray()
  @Type(() => Number)
  layoutIds: number[];
}
