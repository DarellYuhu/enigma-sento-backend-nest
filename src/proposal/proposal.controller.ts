import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Role } from '@prisma/client';
import { UpdateProposalStatusDto } from './dto/updateStatus-proposal.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Roles } from 'src/core/roles/roles.decorator';
import { RolesGuard } from 'src/core/roles/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Roles('CREATOR')
  @Post()
  async create(@Body() createProposalDto: CreateProposalDto, @Req() req) {
    const user: JwtPayload = req.user;
    const data = await this.proposalService.create(user.sub, createProposalDto);
    return { message: 'success', data };
  }

  @Get()
  async findAll(@Req() req, @Query('available') available: boolean) {
    const user: JwtPayload = req.user;
    const data = await this.proposalService.findAll(
      user.sub,
      user.role as Role,
      available,
    );
    return { message: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.proposalService.findOne(id);
    return { message: 'success', data };
  }

  @Roles('CREATOR')
  @Post(':id/submissions')
  async createSubmission(
    @Param('id') id: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    const data = await this.proposalService.createSubmission(
      id,
      createSubmissionDto,
    );
    return { message: 'success', data };
  }

  @Roles('MANAGER')
  @Patch(':id/submission/:submissionId/status')
  async updateProposalStatus(
    @Body() updateProposalStatusDto: UpdateProposalStatusDto,
    @Param('id') proposalId: string,
    @Param('submissionId') submissionId: string,
    @Req() req,
  ) {
    const user: JwtPayload = req.user;
    const data = await this.proposalService.updateProposalStatus(
      proposalId,
      +submissionId,
      user.sub,
      updateProposalStatusDto,
    );
    return { message: 'success', data };
  }
}
