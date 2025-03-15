import { Module } from '@nestjs/common';
import { QdrantService } from './qdrant.service';
import { QdrantController } from './qdrant.controller';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [QdrantController],
  providers: [
    {
      inject: [ConfigService],
      provide: QdrantClient,
      useFactory: (config: ConfigService) => {
        return new QdrantClient({ url: config.get('QDRANT_URI') });
      },
    },
    QdrantService,
  ],
  exports: [QdrantService],
})
export class QdrantModule {}
