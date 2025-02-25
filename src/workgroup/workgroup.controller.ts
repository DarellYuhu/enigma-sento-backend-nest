import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkgroupService } from './workgroup.service';
import { CreateWorkgroupDto } from './dto/create-workgroup.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { FindAllWorkgroupResponseDto } from './dto/findAll-workgroup.dto';
import { FindUsersResponseDto } from './dto/findUsers-workgroup.dto';
import { FindGroupDistributionsResponseDto } from './dto/findGroupDistributions-workgroup.dto';
import { FindUserTasksResponseDto } from './dto/findUserTasks-workgroup.dto';

@UseGuards(AuthGuard)
@Controller('workgroups')
export class WorkgroupController {
  constructor(private readonly workgroupService: WorkgroupService) {}

  @Post()
  create(@Req() req, @Body() createWorkgroupDto: CreateWorkgroupDto) {
    const user: JwtPayload = req.user;
    this.workgroupService.create({
      ...createWorkgroupDto,
      managerId: user.sub,
    });
  }

  @Get()
  async findAll(@Req() req): Promise<FindAllWorkgroupResponseDto> {
    const user: JwtPayload = req.user;
    const data = await this.workgroupService.findAll(user.sub);
    return { message: 'success', data };
  }

  @Get(':id/users')
  async findUsers(@Param('id') id: string): Promise<FindUsersResponseDto> {
    const data = await this.workgroupService.findUsers(id);
    return { message: 'success', data };
  }

  @Get(':id/group-distributions')
  async findGroupDistributions(
    @Param('id') id: string,
  ): Promise<FindGroupDistributionsResponseDto> {
    const data = await this.workgroupService.findGroupDistributions(id);
    return { message: 'success', data };
  }

  @Get(':id/user-tasks')
  async findUserTasks(
    @Param('id') id: string,
  ): Promise<FindUserTasksResponseDto> {
    const data = await this.workgroupService.findUserTasks(id);
    return { message: 'success', data };
  }
}
