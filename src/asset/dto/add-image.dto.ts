import { Location } from '../schemas/image.schema';

class Image {
  name: string;
  path: string;
  description: string;
  tags: string[];
  people: string[];
  location: Location;
}

export class AddImageRequestDto {
  data: Image[];
}
