import { Role } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  displayName: string;
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsEnum(['MANAGER', 'CREATOR', 'DISTRIBUTOR'])
  @IsNotEmpty()
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
