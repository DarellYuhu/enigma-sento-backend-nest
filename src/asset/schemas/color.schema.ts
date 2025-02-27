import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Color {
  @Prop()
  primary: string;
  @Prop()
  secondary: string;
}

export const ColorSchema = SchemaFactory.createForClass(Color);
