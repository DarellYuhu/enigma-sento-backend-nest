import { StoryType } from '@prisma/client';

class Image {
  path: string;
  name: string;
}

class Section {
  texts: string[];
  textColor: string;
  textBgColor: string;
  textStroke: string;
  textPosition: 'random' | 'middle' | 'bottom';
  images: Image[];
}

export class CreateStoryDto {
  data: Section[];
  type: StoryType[];
  projectId: string;
  section: number;
}
