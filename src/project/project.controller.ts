import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import {
  CreateProjectRequestDto,
  CreateProjectResponseDto,
} from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectRequestDto,
    @Req() req,
  ): Promise<CreateProjectResponseDto> {
    const user: JwtPayload = req.user;
    const data = await this.projectService.create(createProjectDto, user.sub);
    return { message: 'success', data };
  }

  // @Get()
  // findAll() {
  //   return this.projectService.findAll();
  // }

  @Get()
  async findByWorkgroupId(
    @Req() req,
    @Query('workgroupId') workgroupId: string,
  ) {
    const user: JwtPayload = req.user;
    const data = await this.projectService.findByWorkgroupId(
      workgroupId,
      user.sub,
    );
    return { message: 'success', data };
  }

  @Post(':id/content-distributions')
  async generateDistribution(@Param('id') id: string) {
    await this.projectService.generateDistribution(id);
    return { message: 'success' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(+id);
  }
}
