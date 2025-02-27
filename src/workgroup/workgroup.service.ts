import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkgroupRequestDto } from './dto/create-workgroup.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupDistribution, WorkgroupUser } from '@prisma/client';
import { shuffle } from 'lodash';

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
          distinct: ['projectId'],
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

  async generateUserTasks(workgroupId: string) {
    const workgroup = await this.prisma.workgroup.findUnique({
      where: { id: workgroupId },
      include: {
        DistributionGroup: true,
        WorkgroupUser: {
          where: { User: { role: 'CREATOR' }, isDeleted: false },
        },
      },
    });
    if (!workgroup) throw new NotFoundException('Workgroup not found');
    const distributed = this.distributeGroupDistribution(
      workgroup.WorkgroupUser,
      workgroup.DistributionGroup,
    );

    return await this.prisma.taskHistory.create({
      data: {
        workgroupId,
        WorkgroupUserTask: {
          createMany: { data: distributed },
        },
      },
    });
  }

  private distributeGroupDistribution(
    users: WorkgroupUser[],
    tasks: GroupDistribution[],
  ) {
    const result: { workgroupUserId: number; groupDistributionId: string }[] =
      [];
    const randomizedUsers = shuffle(users);
    let userIndex = 0;

    for (const task of tasks) {
      const user = randomizedUsers[userIndex];
      result.push({ workgroupUserId: user.id, groupDistributionId: task.id });
      userIndex = (userIndex + 1) % randomizedUsers.length;
    }

    return result;
  }
}
