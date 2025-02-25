import { GroupDistribution as PrismaGroupDistribution } from '@prisma/client';

export class GroupDistribution implements PrismaGroupDistribution {
  workgroupId: string;
  amontOfTroops: number;
  code: string;
  id: string;
}
