import { Role } from '@prisma/client';

export class CreateUserRequestDto {
  displayName: string;
  username: string;
  password: string;
  role: 'MANAGER' | 'CREATOR' | 'DISTRIBUTOR';
}

export class CreateUserResponseDto {
  message: string;
  data: {
    id: string;
    username: string;
    displayName: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
}
