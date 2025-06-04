import { Module } from '@nestjs/common';
import { LayoutGroupService } from './layout-group.service';
import { LayoutGroupController } from './layout-group.controller';

@Module({
  controllers: [LayoutGroupController],
  providers: [LayoutGroupService],
})
export class LayoutGroupModule {}
