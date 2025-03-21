import { OmitType, PickType } from '@nestjs/swagger';
import { CreateProposalDto } from './create-proposal.dto';

export class CreateSubmissionDto extends OmitType(CreateProposalDto, [
  'title',
] as const) {}
