import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTaskDistribution(id: number) {
    const { WorkgroupUserTask, createdAt } =
      await this.prisma.taskHistory.findUniqueOrThrow({
        where: { id },
        include: {
          Workgroup: true,
          WorkgroupUserTask: {
            select: {
              WorkgroupUser: { select: { User: true } },
              GroupDistribution: true,
            },
          },
        },
      });

    const map = WorkgroupUserTask.map((item) => ({
      name: item.WorkgroupUser.User.displayName,
      code: item.GroupDistribution.code,
    }));
    const worksheet = xlsx.utils.json_to_sheet(map);
    const workbook = xlsx.utils.book_new();
    const fileName = `GroupDistributions_${
      createdAt.toISOString().split('T')[0]
    }.xlsx`;
    xlsx.utils.book_append_sheet(workbook, worksheet);
    const fileBuffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    return {
      fileBuffer,
      fileName,
    };
  }
}
