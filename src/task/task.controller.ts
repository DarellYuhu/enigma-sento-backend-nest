import { Controller, Param, Post, StreamableFile } from '@nestjs/common';
import { TaskService } from './task.service';
import { Readable } from 'stream';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post(':id/export')
  async exportTaskDistribution(
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const { fileBuffer, fileName } =
      await this.taskService.exportTaskDistribution(+id);
    const buffer = Buffer.from(fileBuffer);
    const stream = Readable.from(buffer);
    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename=${fileName}`,
    });
  }
}
