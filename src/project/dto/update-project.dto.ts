import { PartialType } from '@nestjs/swagger';
import { CreateProjectRequestDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectRequestDto) {}
