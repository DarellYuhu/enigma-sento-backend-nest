import { PickType } from '@nestjs/mapped-types';
import { GroupDistribution } from './findGroupDistributions-workgroup.dto';

export class TaskGroupDistribution extends PickType(GroupDistribution, [
  'amontOfTroops',
  'code',
]) {}

export class TaskUser {
  workgroupUserId: number;
  displayName: string;
  distributions: TaskGroupDistribution[];
}

export class TaskData {
  users: TaskUser[];
  id: number;
  createdAt: Date;
  workgroupId: string;
}

export class FindUserTasksResponseDto {
  message: string;
  data: TaskData[];
}
