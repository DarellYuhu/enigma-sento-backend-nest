import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { SchemaFor } from '@qdrant/js-client-rest/dist/types/types';
import { v4 as uuid } from 'uuid';

@Injectable()
export class QdrantService {
  constructor(private readonly qdrantClient: QdrantClient) {}

  async createCollection(name: string, config: SchemaFor<'CreateCollection'>) {
    const { exists } = await this.qdrantClient.collectionExists(name);
    if (!exists) return await this.qdrantClient.createCollection(name, config);
  }

  insertData(payload: Payload) {
    return this.qdrantClient.upsert(payload.collectionName, {
      wait: true,
      points: payload.points.map((item) => {
        const id = uuid();
        return {
          id,
          vector: item.vector,
          payload: { id: item.storyId },
        };
      }),
    });
  }

  async query(
    collectionName: string,
    query: number[],
    score_threshold: number = 0.7,
  ) {
    const { groups } = await this.qdrantClient.queryGroups(collectionName, {
      score_threshold,
      group_by: 'id',
      query,
    });
    return groups.map((item) => item.id as string);
  }
}

type Payload = {
  collectionName: string;
  points: { vector: number[]; storyId: string }[];
};
