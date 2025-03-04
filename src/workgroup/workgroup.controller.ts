import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { WorkgroupService } from './workgroup.service';
import {
  CreateWorkgroupRequestDto,
  CreateWorkgroupResponseDto,
} from './dto/create-workgroup.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { FindAllWorkgroupResponseDto } from './dto/findAll-workgroup.dto';
import { FindUsersResponseDto } from './dto/findUsers-workgroup.dto';
import { FindGroupDistributionsResponseDto } from './dto/findGroupDistributions-workgroup.dto';
import { FindUserTasksResponseDto } from './dto/findUserTasks-workgroup.dto';
import {
  AddUsersRequestDto,
  AddUsersResponseDto,
} from './dto/addUsers-workgroup.dto';
import { GenerateUserTasksResponseDto } from './dto/generateUserTasks-workgroup.dto';

@UseGuards(AuthGuard)
@Controller('workgroups')
export class WorkgroupController {
  constructor(private readonly workgroupService: WorkgroupService) {}

  @Post()
  async create(
    @Req() req,
    @Body() createWorkgroupDto: CreateWorkgroupRequestDto,
  ): Promise<CreateWorkgroupResponseDto> {
    const user: JwtPayload = req.user;
    const data = await this.workgroupService.create({
      ...createWorkgroupDto,
      managerId: user.sub,
    });
    return { message: 'success', data };
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

  @Post(':id/users')
  async addUsers(
    @Param('id') id: string,
    @Body() addUsersRequestDto: AddUsersRequestDto,
  ): Promise<AddUsersResponseDto> {
    const data = await this.workgroupService.addUsers(
      id,
      addUsersRequestDto.users,
    );
    return { message: 'success', data };
  }

  @Delete(':id/users/:userId')
  async deleteUser(
    @Param('id') workgroupId: string,
    @Param('userId') userId: string,
  ) {
    await this.workgroupService.deleteUser(workgroupId, userId);
    return { message: 'ok' };
  }

  @Get(':id/group-distributions')
  async findGroupDistributions(
    @Param('id') id: string,
  ): Promise<FindGroupDistributionsResponseDto> {
    const data = await this.workgroupService.findGroupDistributions(id);
    return { message: 'success', data };
  }

  @Post(':id/user-tasks')
  async generateUserTasks(
    @Param('id') id: string,
  ): Promise<GenerateUserTasksResponseDto> {
    const data = await this.workgroupService.generateUserTasks(id);
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
