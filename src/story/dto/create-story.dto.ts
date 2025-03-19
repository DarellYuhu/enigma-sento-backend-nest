import { StoryType } from '@prisma/client';

export class ImageData {
  path: string;
  name: string;
}

export class SectionData {
  texts: string[];
  textColor: string;
  textBgColor: string;
  textStroke: string;
  imageType: 'Collection' | 'Upload';
  textPosition: 'random' | 'middle' | 'bottom';
  images: ImageData[];
}

export class CreateStoryDto {
  data: SectionData[];
  type: StoryType[];
  projectId: string;
  section: number;
}
