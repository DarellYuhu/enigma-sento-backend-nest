import { AllocationType } from '@prisma/client';
import { Project } from '../entities/project.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  captions?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  hashtags?: string | null;

  @IsEnum(AllocationType)
  allocationType: AllocationType;

  @IsNotEmpty()
  @IsString()
  workgroupId: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  proposalId?: string;
}

export class CreateProjectResponseDto {
  message: string;
  data: Project;
}
