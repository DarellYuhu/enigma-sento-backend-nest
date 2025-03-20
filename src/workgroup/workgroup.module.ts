import { Module } from '@nestjs/common';
import { WorkgroupService } from './workgroup.service';
import { WorkgroupController } from './workgroup.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkgroupController],
  providers: [WorkgroupService, PrismaService],
})
export class WorkgroupModule {}
