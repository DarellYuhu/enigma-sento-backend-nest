import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Workgroup } from '../entities/workgroup.entity';

export class CreateWorkgroupRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  session: number;

  @IsNumber()
  @IsNotEmpty()
  projectStoryPerUser: number;
}

export class CreateWorkgroupResponseDto {
  message: string;
  data: Workgroup;
}
