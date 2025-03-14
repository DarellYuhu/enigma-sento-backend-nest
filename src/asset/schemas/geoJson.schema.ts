import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class GeoJson {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;
  @Prop({
    type: [Number],
    validate: {
      validator: (val: number[]) =>
        val.length === 2 && val.every((num) => !isNaN(num)),
      message:
        'Coordinates must be an array of two numbers [longitude, latitude]',
    },
  })
  coordinates: [number, number];
}

export const GeoJsonSchema = SchemaFactory.createForClass(GeoJson);
