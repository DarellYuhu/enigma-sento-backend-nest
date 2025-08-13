import z from 'zod';

export const validXlsxSchema = z
  .array(z.object({ group_keys: z.string() }))
  .transform((val) => val.map((i) => i.group_keys));
