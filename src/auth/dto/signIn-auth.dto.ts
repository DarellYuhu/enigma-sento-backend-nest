import { Role } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInAuthRequestDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignInAuthResponseDto {
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      displayName: string;
      role: Role;
    };
  };
}
