import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateLayoutDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  template: object;

  @IsString()
  @IsNotEmpty()
  creatorId: string;
}
