import { z } from 'zod/v4';

export const templateSchema = z.object({
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  shapes: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      key: z.string(),
      align: z.enum(['left', 'center', 'right', 'justify']),
      rotation: z.number(),
      type: z.enum(['rectangle', 'triangle', 'circle', 'text']),
      value: z.string().optional(),
    }),
  ),
});
