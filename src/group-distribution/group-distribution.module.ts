import { Module } from '@nestjs/common';
import { GroupDistributionService } from './group-distribution.service';
import { GroupDistributionController } from './group-distribution.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [GroupDistributionController],
  providers: [GroupDistributionService, PrismaService],
})
export class GroupDistributionModule {}
