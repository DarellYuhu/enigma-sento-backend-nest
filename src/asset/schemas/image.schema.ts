import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GeoJson, GeoJsonSchema } from './geoJson.schema';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class Location {
  @Prop()
  name: string;
  @Prop({ type: GeoJsonSchema })
  geoJson: GeoJson;
}
const LocationSchema = SchemaFactory.createForClass(Location);
@Schema({ timestamps: true })
export class Image {
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
  description: string;
  @Prop({ type: [String], default: [] })
  tags: string[];
  @Prop({
    ref: 'People',
    type: [Types.ObjectId],
    validate: {
      validator: function (value: string[]) {
        return new Set(value.map((v) => v.toString())).size === value.length;
      },
      message: 'Duplicate asset IDs are not allowed.',
    },
  })
  people: Types.ObjectId[];
  @Prop({ type: LocationSchema, required: false })
  location?: Location;
}
export const ImageSchema = SchemaFactory.createForClass(Image);
ImageSchema.index({ description: 'text', tags: 'text' }, { name: 'text' });
