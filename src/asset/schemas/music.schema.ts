import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: {
    createdAt: 'addedAt',
    updatedAt: false,
  },
})
export class Music {
  @Prop()
  title: string;
  @Prop()
  path: string;
  @Prop()
  type: string;
  @Prop()
  size: number;
  @Prop()
  duration: number;
  @Prop()
  album?: string;
  @Prop()
  artist?: string;
  @Prop()
  year?: string;
}

export const MusicSchema = SchemaFactory.createForClass(Music);
