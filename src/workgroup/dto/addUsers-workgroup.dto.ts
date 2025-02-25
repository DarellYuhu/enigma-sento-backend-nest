export class AddUsersRequestDto {
  readonly users: string[];
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
