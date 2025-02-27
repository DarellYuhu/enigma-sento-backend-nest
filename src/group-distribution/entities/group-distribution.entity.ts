import { GroupDistribution as PrismaGroupDistribution } from '@prisma/client';

export class GroupDistribution implements PrismaGroupDistribution {
  workgroupId: string;
  amontOfTroops: number;
  isDeleted: boolean;
  code: string;
  id: string;
}
