import { createZodDto } from 'nestjs-zod';
import z from 'zod/v4';

export const downloadGroupsSchema = z.object({
  generatedGroup: z.string().nonempty(),
  groups: z.array(z.string().nonempty()).nonempty(),
});

export class DownloadGroupsDto extends createZodDto(downloadGroupsSchema) {}
