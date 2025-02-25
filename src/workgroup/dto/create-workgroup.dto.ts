import { Workgroup } from '../entities/workgroup.entity';

export class CreateWorkgroupRequestDto {
  name: string;
  session: number;
  projectStoryPerUser: number;
}

export class CreateWorkgroupResponseDto {
  message: string;
  data: Workgroup;
}
