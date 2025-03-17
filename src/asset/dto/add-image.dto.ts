import { Location } from '../schemas/image.schema';

export class ImageData {
  name: string;
  path: string;
  description: string;
  tags: string[];
  people: string[];
  location: Location;
}

export class AddImageRequestDto {
  data: ImageData[];
}
