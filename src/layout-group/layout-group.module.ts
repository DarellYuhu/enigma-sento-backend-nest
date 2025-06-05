import { Module } from '@nestjs/common';
import { LayoutGroupService } from './layout-group.service';
import { LayoutGroupController } from './layout-group.controller';
import { AssetModule } from 'src/asset/asset.module';
import { CollectionModule } from 'src/collection/collection.module';
import { LayoutModule } from 'src/layout/layout.module';

@Module({
  imports: [AssetModule, CollectionModule, LayoutModule],
  controllers: [LayoutGroupController],
  providers: [LayoutGroupService],
})
export class LayoutGroupModule {}
