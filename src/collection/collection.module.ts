import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { People, PeopleSchema } from './schemas/people.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collection.name, schema: CollectionSchema },
      { name: People.name, schema: PeopleSchema },
    ]),
  ],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}
