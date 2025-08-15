import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { UpdateProposalStatusDto } from './dto/updateStatus-proposal.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class ProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly minio: MinioService,
  ) {}

  async create(authorId: string, createProposalDto: CreateProposalDto) {
    const { title, fileName, filePath, workgroupId } = createProposalDto;
    await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${filePath} myminio/assets/${filePath}`;
    return this.prisma.proposal.create({
      data: {
        workgroupId,
        authorId,
        title: title,
        Submission: {
          create: {
            filePath,
            fileName,
          },
        },
      },
    });
  }

  findAll(authorId: string, role?: Role, available?: boolean) {
    let query: Prisma.ProposalWhereInput = { authorId };
    if (role === 'MANAGER') query = {};
    if (available) {
      query.status = 'ACCEPTED';
      query.projectId = null;
    }
    return this.prisma.proposal.findMany({
      where: query,
      include: {
        Author: { select: { displayName: true, id: true } },
        Approver: { select: { displayName: true, id: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createSubmission(
    proposalId: string,
    createSubmissionDto: CreateSubmissionDto,
  ) {
    const { fileName, filePath } = createSubmissionDto;
    const { status } = await this.prisma.proposal
      .findUniqueOrThrow({ where: { id: proposalId } })
      .catch(() => {
        throw new NotFoundException('Proposal not found');
      });

    if (status !== 'REVISIED')
      throw new ForbiddenException(
        'Submission is only allowed for proposals that require revision.',
      );

    await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${filePath} myminio/assets/${filePath}`;
    const [submission] = await this.prisma.$transaction([
      this.prisma.submission.create({
        data: { fileName, filePath, proposalId },
      }),
      this.prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'WAITING' },
      }),
    ]);

    return submission;
  }

  async updateProposalStatus(
    proposalId: string,
    submissionId: number,
    userId: string,
    updateProposalStatusDto: UpdateProposalStatusDto,
  ) {
    const { status, feedback } = updateProposalStatusDto;
    const data: Prisma.ProposalUncheckedUpdateInput = {
      status,
      Submission: {
        update: {
          where: { id: submissionId },
          data: {
            status,
            Feedback: feedback
              ? {
                  create: {
                    userId,
                    message: feedback?.message,
                    fileName: feedback?.fileName,
                    filePath: feedback?.filePath,
                  },
                }
              : undefined,
          },
        },
      },
    };
    const { status: proposalStatus } = await this.prisma.proposal
      .findUniqueOrThrow({ where: { id: proposalId } })
      .catch(() => {
        throw new NotFoundException('Proposal not found');
      });
    if (proposalStatus !== 'WAITING')
      throw new ForbiddenException('Only waiting proposals can be updated');
    if (feedback && feedback.filePath) {
      await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${feedback.filePath} myminio/assets/${feedback.filePath}`;
    }
    if (status === 'ACCEPTED' || status === 'REJECTED') {
      data.approverId = userId;
      data.submissionId = submissionId;
      data.approvedAt = new Date();
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data,
    });
  }

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUniqueOrThrow({
      where: { id },
      include: {
        Submission: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            Feedback: {
              include: { User: { select: { id: true, displayName: true } } },
            },
          },
        },
        Author: { select: { id: true, displayName: true } },
        Approver: { select: { id: true, displayName: true } },
      },
    });
    return {
      ...proposal,
      Feedback: (
        await Promise.all(
          proposal.Submission.map(
            async (sub) =>
              await Promise.all(
                sub.Feedback.map(async (item) => ({
                  ...item,
                  uri: item.filePath
                    ? await this.minio.presignedGetObject(
                        'assets',
                        item.filePath,
                      )
                    : undefined,
                })),
              ),
          ),
        )
      ).flat(),
      Submission: await Promise.all(
        proposal.Submission.map(async (submission) => ({
          ...submission,
          url: await this.minio.presignedGetObject(
            'assets',
            submission.filePath,
          ),
        })),
      ),
    };
  }
}
