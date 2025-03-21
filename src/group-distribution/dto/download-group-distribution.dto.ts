import { IsArray, IsNotEmpty, IsString, Min } from 'class-validator';

export class DownloadGroupDistributionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Min(1)
  projectIds: string[];
}
