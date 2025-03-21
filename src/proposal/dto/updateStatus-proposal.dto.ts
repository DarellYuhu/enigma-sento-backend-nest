import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum StatusWithoutWaiting {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  REVISIED = 'REVISIED',
}

export class Feedback {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  fileName: string;
}

export class UpdateProposalStatusDto {
  @IsNotEmpty()
  @IsEnum(StatusWithoutWaiting)
  status: StatusWithoutWaiting;

  @IsOptional()
  @ValidateNested()
  @Type(() => Feedback)
  feedback?: Feedback;
}
