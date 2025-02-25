import { Workgroup } from '../entities/workgroup.entity';

export class FindAllWorkgroupResponseDto {
  message: string;
  data: Workgroup[];
}
