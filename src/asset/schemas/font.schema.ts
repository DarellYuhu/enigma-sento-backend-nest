import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Font {
  @Prop()
  path: string;
  @Prop()
  name: string;
}

export const FontSchema = SchemaFactory.createForClass(Font);
