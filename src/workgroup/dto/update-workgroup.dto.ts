import { PartialType } from '@nestjs/swagger';
import { CreateWorkgroupDto } from './create-workgroup.dto';

export class UpdateWorkgroupDto extends PartialType(CreateWorkgroupDto) {}
