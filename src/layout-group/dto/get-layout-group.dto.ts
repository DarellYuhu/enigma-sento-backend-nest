import { createZodDto } from 'nestjs-zod';
import z from 'zod/v4';

const GetLayoutGroupSchema = z
  .object({
    search: z.string(),
  })
  .partial();

export class GetLayoutGroupDto extends createZodDto(GetLayoutGroupSchema) {}
