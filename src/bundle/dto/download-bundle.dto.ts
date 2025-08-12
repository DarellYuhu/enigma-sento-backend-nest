// import {
//   ArrayNotEmpty,
//   IsArray,
//   IsNotEmpty,
//   IsNumber,
//   IsString,
// } from 'class-validator';
import z from 'zod/v4';

// export class DownloadBundleDto {
//   @IsNumber()
//   @IsNotEmpty()
//   count: number;
//
//   @IsArray()
//   @IsString({ each: true })
//   @ArrayNotEmpty()
//   @IsNotEmpty()
//   bundleIds: string[];
// }

export const downloadBundleSchema = z
  .object({
    count: z.number().positive(),
    groupKeys: z.array(z.string()),
    bundleIds: z.array(z.string()),
  })
  .refine(
    (data) =>
      (data.count && !data.groupKeys) || (!data.count && data.groupKeys),
    {
      message: 'Either count or groupKeys must be provided, but not both',
      path: ['count'], // or a more general path like []
    },
  )
  .partial({ groupKeys: true, count: true })
  .required({ bundleIds: true });

export type DownloadBundleDto = z.infer<typeof downloadBundleSchema>;
