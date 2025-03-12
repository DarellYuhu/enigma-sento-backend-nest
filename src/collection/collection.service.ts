import { Injectable } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Collection } from './schemas/collection.schema';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { People } from './schemas/people.schema';

@Injectable()
export class CollectionService {
  constructor(
    @InjectModel(Collection.name) private collection: Model<Collection>,
    @InjectModel(People.name) private people: Model<People>,
  ) {}

  create(createCollectionDto: CreateCollectionDto) {
    return this.collection.create(createCollectionDto);
  }

  findAll(query: { type: CollectionType }) {
    return this.collection.find({ type: query.type }).lean();
  }

  createPerson(createPersonDto: CreatePersonDto) {
    this.people.create(createPersonDto);
  }

  findOne(id: number) {
    return `This action returns a #${id} collection`;
  }

  update(id: number, updateCollectionDto: UpdateCollectionDto) {
    return `This action updates a #${id} collection`;
  }

  remove(id: number) {
    return `This action removes a #${id} collection`;
  }
}
