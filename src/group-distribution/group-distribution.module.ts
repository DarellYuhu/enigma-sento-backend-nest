import { Module } from '@nestjs/common';
import { GroupDistributionService } from './group-distribution.service';
import { GroupDistributionController } from './group-distribution.controller';

@Module({
  controllers: [GroupDistributionController],
  providers: [GroupDistributionService],
})
export class GroupDistributionModule {}
