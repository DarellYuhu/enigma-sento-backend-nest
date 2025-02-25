import { PartialType } from '@nestjs/swagger';
import { Section } from '../schemas/story.schema';

export class NewImage {
  path: string;
  name: string;
}

export class DeletedImage extends NewImage {
  _id: string;
}

export class UpdateSectionRequestDto extends PartialType(Section) {
  newImages: NewImage[];
  deletedImages: DeletedImage[];
}
