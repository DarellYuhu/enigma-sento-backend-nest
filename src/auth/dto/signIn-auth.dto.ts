import { Role } from '@prisma/client';

export class SignInAuthRequestDto {
  username: string;
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
