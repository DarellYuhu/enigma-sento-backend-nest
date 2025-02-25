import { AllocationType } from '@prisma/client';
import { Project } from '../entities/project.entity';

export class CreateProjectRequestDto {
  name: string;
  captions?: string;
  hashtags?: string;
  allocationType: AllocationType;
  workgroupId: string;
}

export class CreateProjectResponseDto {
  message: string;
  data: Project;
}
