import { Module } from '@nestjs/common';
import { QdrantService } from './qdrant.service';
import { QdrantController } from './qdrant.controller';
import { QdrantClient } from '@qdrant/js-client-rest';

@Module({
  controllers: [QdrantController],
  providers: [
    {
      provide: QdrantClient,
      useFactory() {
        return new QdrantClient({ url: 'http://localhost:6333' });
      },
    },
    QdrantService,
  ],
  exports: [QdrantService],
})
export class QdrantModule {}
