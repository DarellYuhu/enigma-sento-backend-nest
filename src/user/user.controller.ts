import { Controller, Post, Body, Get } from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
} from './dto/create-user.dto';
import { FindAllUserResponseDto } from './dto/findAll-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Create new user
   * @param createUserRequestDto
   * @returns
   */
  @Post()
  async create(
    @Body() createUserRequestDto: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    const data = await this.userService.create(createUserRequestDto);
    return { message: 'success', data };
  }

  /**
   * Get all users
   */
  @Get()
  async findAll(): Promise<FindAllUserResponseDto> {
    const data = await this.userService.findAll();
    return { message: 'success', data };
  }
  //   @Get(':id')
  //   findOne(@Param('id') id: string) {
  //     return this.userService.findOne(+id);
  //   }
  //   @Patch(':id')
  //   update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //     return this.userService.update(+id, updateUserDto);
  //   }
  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.userService.remove(+id);
  //   }
}
