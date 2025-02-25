export class WorkgroupUserData {
  workgroupId: number;
  userId: string;
  username: string;
  role: string;
  displayName: string;
}

export class FindUsersResponseDto {
  message: string;
  data: WorkgroupUserData[];
}
