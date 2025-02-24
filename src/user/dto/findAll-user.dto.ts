import { User } from '../entities/user.entity';

export class FindAllUserResponseDto {
  message: string;
  data: User[];
}
