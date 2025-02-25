import { $Enums, Project as PrismaProject } from '@prisma/client';

export class Project implements PrismaProject {
  allocationType: $Enums.AllocationType;
  captions: string[];
  hashtags: string;
  id: string;
  name: string;
  status: boolean;
  workgroupId: string;
  workgroupUserId: number;
}
