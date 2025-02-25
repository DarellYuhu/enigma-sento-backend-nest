import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GeneratorStatus, StoryType } from '@prisma/client';

@Schema()
class Image {
  @Prop()
  path: string;
  @Prop()
  name: string;
}
const ImageSchema = SchemaFactory.createForClass(Image);

@Schema()
export class Section {
  @Prop()
  texts: string[];

  @Prop()
  textColor: string;

  @Prop()
  textBgColor: string;

  @Prop()
  textStroke: string;

  @Prop()
  textPosition: 'random' | 'middle' | 'bottom';

  @Prop([ImageSchema])
  images: Image[];
}
const SectionSchema = SchemaFactory.createForClass(Section);

@Schema({ timestamps: true })
export class Story {
  @Prop()
  section?: number;
  @Prop([SectionSchema])
  data?: Section[];
  @Prop()
  captions?: string[];
  @Prop()
  contentPerStory?: number;
  @Prop({
    type: String,
    enum: GeneratorStatus,
    default: GeneratorStatus.NOT_GENERATE,
  })
  generatorStatus?: string;
  @Prop({ enum: StoryType })
  type?: string;
  @Prop()
  hashtags?: string;
  @Prop()
  projectId: string;
}

export const StorySchema = SchemaFactory.createForClass(Story);
