import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class People {
  @Prop({ unique: true })
  name: string;
}
export const PeopleSchema = SchemaFactory.createForClass(People);
