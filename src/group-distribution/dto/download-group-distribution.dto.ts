import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DownloadGroupDistributionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayNotEmpty()
  projectIds: string[];
}
