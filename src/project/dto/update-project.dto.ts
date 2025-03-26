import { PartialType, PickType } from '@nestjs/swagger';
import { CreateProjectRequestDto } from './create-project.dto';

export class UpdateProjectDto extends PickType(
  PartialType(CreateProjectRequestDto),
  ['name'],
) {}
