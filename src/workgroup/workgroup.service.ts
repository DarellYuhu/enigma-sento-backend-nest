import { Injectable } from '@nestjs/common';
import { CreateWorkgroupRequestDto } from './dto/create-workgroup.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkgroupService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateWorkgroupRequestDto & { managerId: string }) {
    return this.prisma.workgroup.create({ data: payload });
  }

  findAll(userId: string) {
    return this.prisma.workgroup.findMany({
      where: {
        OR: [
          { Manager: { id: userId } },
          { WorkgroupUser: { some: { userId, isDeleted: false } } },
        ],
      },
    });
  }

  async findUsers(workgroupId: string) {
    const workgroups = await this.prisma.workgroupUser.findMany({
      where: { workgroupId, isDeleted: false },
      include: {
        User: { select: { username: true, role: true, displayName: true } },
      },
    });

    return workgroups.map((workgroup) => ({
      workgroupId: workgroup.id,
      userId: workgroup.userId,
      username: workgroup.User.username,
      role: workgroup.User.role,
      displayName: workgroup.User.displayName,
    }));
  }

  async addUsers(workgroupId: string, userIds: string[]) {
    return this.prisma.$transaction(
      userIds.map((userId) =>
        this.prisma.workgroupUser.upsert({
          create: { userId, workgroupId },
          update: { isDeleted: false },
          where: { workgroupId_userId: { userId, workgroupId } },
        }),
      ),
    );
  }

  async findGroupDistributions(workgroupId: string) {
    const groupDistributions = await this.prisma.groupDistribution.findMany({
      where: { workgroupId },
      include: {
        ContentDistribution: {
          select: { Project: true },
        },
      },
    });
    const normalized = groupDistributions.map(
      ({ ContentDistribution, ...rest }) => {
        return {
          ...rest,
          projects: ContentDistribution.map((item) => item.Project),
        };
      },
    );
    return normalized;
  }

  async findUserTasks(workgroupId: string) {
    const { TaskHistory } = await this.prisma.workgroup.findUniqueOrThrow({
      where: { id: workgroupId },
      include: {
        TaskHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            WorkgroupUserTask: {
              include: {
                GroupDistribution: true,
                WorkgroupUser: {
                  select: { User: { select: { displayName: true } }, id: true },
                },
              },
            },
          },
        },
      },
    });

    const normalized = TaskHistory.map(({ WorkgroupUserTask, ...rest }) => {
      const map = new Map<
        number,
        {
          workgroupUserId: number;
          displayName: string;
          distributions: {
            code: string;
            amontOfTroops: number;
          }[];
        }
      >();

      for (const {
        WorkgroupUser,
        GroupDistribution,
        workgroupUserId,
      } of WorkgroupUserTask) {
        if (!map.has(WorkgroupUser.id)) {
          map.set(WorkgroupUser.id, {
            displayName: WorkgroupUser.User.displayName,
            workgroupUserId: workgroupUserId,
            distributions: [
              {
                code: GroupDistribution.code,
                amontOfTroops: GroupDistribution.amontOfTroops,
              },
            ],
          });
        } else {
          const { distributions, ...rest } = map.get(workgroupUserId)!;
          map.set(workgroupUserId, {
            ...rest,
            distributions: [
              ...distributions,
              {
                code: GroupDistribution.code,
                amontOfTroops: GroupDistribution.amontOfTroops,
              },
            ],
          });
        }
      }

      return [
        rest.id,
        {
          ...rest,
          users: Array.from(map.values()),
        },
      ];
    });
    return Object.fromEntries(normalized);
  }
}
