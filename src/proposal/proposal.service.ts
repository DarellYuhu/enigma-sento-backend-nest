import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Prisma, ProposalStatus, Role } from '@prisma/client';
import { UpdateProposalStatusDto } from './dto/updateStatus-proposal.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class ProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(authorId: string, createProposalDto: CreateProposalDto) {
    const { title, fileName, filePath } = createProposalDto;
    await Bun.$`${this.config.get('MINIO_CLIENT_COMMAND')} mv myminio/tmp/${filePath} myminio/assets/${filePath}`;
    return this.prisma.proposal.create({
      data: {
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

  findAll(authorId: string, role?: Role) {
    let query: Prisma.ProposalWhereInput = { authorId };
    if (role === 'MANAGER') query = {};
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

  findOne(id: number) {
    return `This action returns a #${id} proposal`;
  }

  update(id: number, updateProposalDto: UpdateProposalDto) {
    return `This action updates a #${id} proposal`;
  }

  remove(id: number) {
    return `This action removes a #${id} proposal`;
  }
}
