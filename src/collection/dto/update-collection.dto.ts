import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection.dto';

export class UpdateCollectionDto extends PartialType(
  OmitType(CreateCollectionDto, ['assets', 'type']),
) {
  deletedAssets?: string[];
  newAssets?: string[];
}
