import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MinioS3Module } from 'src/core/minio-s3/minio-s3.module';

@Module({
  imports: [AuthModule, MinioS3Module],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class ProposalModule {}
