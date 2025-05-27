import { Module } from '@nestjs/common';
import { WorkgroupService } from './workgroup.service';
import { WorkgroupController } from './workgroup.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkgroupController],
  providers: [WorkgroupService],
})
export class WorkgroupModule {}
