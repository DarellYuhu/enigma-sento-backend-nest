import { People } from 'src/collection/schemas/people.schema';
import { Image } from '../schemas/image.schema';
import { OmitType } from '@nestjs/mapped-types';

export class ImagesData extends OmitType(Image, ['people']) {
  people: People[];
}

export class GetImagesDto {
  message: string;
  data: ImagesData[];
}
