import { createZodDto } from 'nestjs-zod';
import z from 'zod/v4';

const UpsertLayoutSchema = z.object({
  name: z.string().nonempty(),
  creatorId: z.string().nonempty(),
  template: z.object({
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
    }),
    shapes: z.array(
      z.object({
        // these one came from the client
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        key: z.string(),
        align: z.enum(['left', 'center', 'right', 'justify']),
        rotation: z.number(),
        type: z.enum(['rectangle', 'triangle', 'circle', 'text']),
        fontId: z.string().optional(),
        fill: z.string().optional(),
        value: z.string().optional(),
        imagePath: z.string().optional(),

        // additional fields
        imageId: z.number().optional(),
        imageUrl: z.string().optional(),
      }),
    ),
  }),
});

export class UpsertLayoutDto extends createZodDto(UpsertLayoutSchema) {}
