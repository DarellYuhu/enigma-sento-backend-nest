import { Workgroup as PrismaWorkgroup } from '@prisma/client';

export class Workgroup implements PrismaWorkgroup {
  createdAt: Date;
  id: string;
  managerId: string;
  name: string;
  projectStoryPerUser: number;
  session: number;
  updatedAt: Date;
}
