export class UserTask {
  id: number;
  createdAt: Date;
  workgroupId: string;
}

export class GenerateUserTasksResponseDto {
  message: string;
  data: UserTask;
}
