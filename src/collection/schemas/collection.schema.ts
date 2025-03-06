import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

const Type = ['MUSIC', 'COLOR', 'FONT', 'REP-IMAGE', 'REP-VIDEO', 'REP-BANNER'];

@Schema({ timestamps: true })
export class Collection {
  @Prop()
  name: string;

  @Prop({ type: String, enum: Type })
  type: string;

  @Prop({ type: [String] })
  assets: string[];
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
