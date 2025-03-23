import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddUsersRequestDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayNotEmpty()
  users: string[];
}

export class WorkgroupUser {
  id: number;
  userId: string;
  workgroupId: string;
  isDeleted: boolean;
}

export class AddUsersResponseDto {
  message: string;
  data: WorkgroupUser[];
}
