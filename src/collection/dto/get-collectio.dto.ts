import { CollectionType } from 'enums';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const GetCollectionQuerySchema = z
  .object({
    search: z.string(),
    assetType: z.enum(CollectionType),
  })
  .partial();

export class GetCollectionQueryDto extends createZodDto(
  GetCollectionQuerySchema,
) {}
