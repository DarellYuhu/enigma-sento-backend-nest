import z from 'zod/v4';

export const multerFileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  mimetype: z.string(),
  size: z.number().positive(),
  path: z.string().optional(),
  buffer: z.instanceof(Buffer).optional(),
});
export type MulterFileSchema = z.infer<typeof multerFileSchema>;
