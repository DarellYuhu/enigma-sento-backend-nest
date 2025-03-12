import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

const Type = ['MUSIC', 'COLOR', 'FONT', 'REP-IMAGE', 'REP-VIDEO', 'REP-BANNER'];

@Schema({ timestamps: true })
export class Collection {
  @Prop()
  name: string;

  @Prop({ type: String, enum: Type })
  type: string;

  @Prop({
    type: [String],
    validate: {
      validator: function (value: string[]) {
        return new Set(value.map((v) => v.toString())).size === value.length;
      },
      message: 'Duplicate asset IDs are not allowed.',
    },
  })
  assets: string[];
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
