import { Injectable } from '@nestjs/common';
import { CreateUserRequestDto } from './dto/create-user.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateUserRequestDto) {
    const hashedPassword = await Bun.password.hash(payload.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
    return await this.prisma.user.create({
      data: { ...payload, password: hashedPassword },
      omit: { password: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany({ omit: { password: true } });
  }

  findOneByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }
}
