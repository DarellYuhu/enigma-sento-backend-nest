import { AllocationType } from '@prisma/client';

export class FindGroupDistributionsResponseDto {
  message: string;
  data: GroupDistribution[];
}

export class Project {
  id: string;
  name: string;
  workgroupId: string;
  status: boolean;
  workgroupUserId: number;
  allocationType: AllocationType;
  captions: string[];
  hashtags: string | null;
}

export class GroupDistribution {
  projects: Project[];
  id: string;
  workgroupId: string;
  code: string;
  amontOfTroops: number;
}
