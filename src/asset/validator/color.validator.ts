import { IsArray, ValidateNested } from 'class-validator';
import { Color } from '../schemas/color.schema';
import { Type } from 'class-transformer';

export class ColorValidator {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Color)
  data: Color[];
}
