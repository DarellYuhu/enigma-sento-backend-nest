import { PartialType } from '@nestjs/mapped-types';
import { GroupDistribution } from '../entities/group-distribution.entity';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDistributionDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}

export class GS extends PartialType(GroupDistribution) {
  @IsNumber()
  amontOfTroops: number;

  @IsString()
  code: string;
}

export class XlsxFileSchema {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GS)
  data: GS[];
}
