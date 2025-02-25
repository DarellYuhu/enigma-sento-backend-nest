import { PartialType } from '@nestjs/mapped-types';
import { GroupDistribution } from '../entities/group-distribution.entity';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDistributionDto {
  file: Express.Multer.File;
}

class GS extends PartialType(GroupDistribution) {
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
