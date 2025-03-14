import { People } from 'src/collection/schemas/people.schema';
import { Image } from '../schemas/image.schema';
import { OmitType } from '@nestjs/mapped-types';

class Data extends OmitType(Image, ['people']) {
  people: People[];
}

export class GetImagesDto {
  message: string;
  data: Data[];
}
