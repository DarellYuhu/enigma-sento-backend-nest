import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Video {
  @Prop()
  name: string;
  @Prop()
  path: string;
  @Prop()
  type: string;
  @Prop()
  width: number;
  @Prop()
  height: number;
  @Prop()
  size: number;
  @Prop()
  duration: number;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
