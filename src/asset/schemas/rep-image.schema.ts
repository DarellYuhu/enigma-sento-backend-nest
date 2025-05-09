import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RepImage {
  @Prop({ unique: true })
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
}

export const RepImageSchema = SchemaFactory.createForClass(RepImage);
