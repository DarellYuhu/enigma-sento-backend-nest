import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

export class FontRequestData {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  path: string;
}

export class AddFontRequestDto {
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => FontRequestData)
  data: FontRequestData[];
}
