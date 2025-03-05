import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Banner {
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

export const BannerSchema = SchemaFactory.createForClass(Banner);
