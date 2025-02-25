import { PartialType } from '@nestjs/swagger';
import { CreateGroupDistributionDto } from './create-group-distribution.dto';

export class UpdateGroupDistributionDto extends PartialType(
  CreateGroupDistributionDto,
) {}
