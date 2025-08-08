import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class DownloadBundleDto {
  @IsNumber()
  @IsNotEmpty()
  count: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @IsNotEmpty()
  bundleIds: string[];
}
