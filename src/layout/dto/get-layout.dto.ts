import { createZodDto } from 'nestjs-zod';
import z from 'zod/v4';

const GetLayoutQuerySchema = z
  .object({
    search: z.string(),
    groupId: z.number(),
  })
  .partial();

export class GetLayoutQueryDto extends createZodDto(GetLayoutQuerySchema) {}
