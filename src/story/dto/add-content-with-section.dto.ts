import { multerFileSchema } from 'src/core/schemas/multer-file.schema';
import z from 'zod/v4';

export const AddContentWithSectionSchema = z
  .object({
    contentPerStory: z.number(),
    keys: z.array(z.string().nonempty()).nonempty(),
    files: z.record(z.string(), z.array(multerFileSchema).nonempty()),
  })
  .superRefine((val, ctx) => {
    for (const [section, files] of Object.entries(val.files)) {
      if (files.length !== val.contentPerStory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Section "${section}" must have exactly ${val.contentPerStory} files, but got ${files.length}`,
          path: ['files', section], // points to files[section]
        });
      }
    }
  });

export type AddContentWithSectionDto = z.infer<
  typeof AddContentWithSectionSchema
>;
