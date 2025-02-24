import { $Enums, User as PrismaUser } from '@prisma/client';

export class User implements Omit<PrismaUser, 'password'> {
  id: string;
  displayName: string;
  username: string;
  role: $Enums.Role;
  createdAt: Date;
  updatedAt: Date;
}
