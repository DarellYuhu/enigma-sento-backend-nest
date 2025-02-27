import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTaskDistribution(id: number) {
    const {
      Workgroup: _,
      WorkgroupUserTask,
      ...task
    } = await this.prisma.taskHistory.findUniqueOrThrow({
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

    const map = new Map<
      string,
      { name: string; groupDistribution: string[] }
    >();

    for (const item of WorkgroupUserTask) {
      if (!map.has(item.WorkgroupUser.User.id)) {
        map.set(item.WorkgroupUser.User.id, {
          name: item.WorkgroupUser.User.displayName,
          groupDistribution: [item.GroupDistribution.code],
        });
      } else {
        const { groupDistribution, name } = map.get(
          item.WorkgroupUser.User.id,
        )!;
        groupDistribution.push(item.GroupDistribution.code);
        map.set(item.WorkgroupUser.User.id, {
          name,
          groupDistribution,
        });
      }
    }
    const worksheet = xlsx.utils.json_to_sheet(
      map
        .values()
        .toArray()
        .map((item) => ({
          ...item,
          groupDistribution: item.groupDistribution.join(', '),
        })),
    );
    const workbook = xlsx.utils.book_new();
    const fileName = `GroupDistributions_${
      task.createdAt.toISOString().split('T')[0]
    }.xlsx`;
    const filePath = `./tmp/${fileName}`;
    xlsx.utils.book_append_sheet(workbook, worksheet);
    xlsx.writeFile(workbook, filePath, { compression: true });

    const fileBuffer = await Bun.file(filePath).arrayBuffer();

    return {
      fileBuffer,
      fileName,
    };
  }
}
