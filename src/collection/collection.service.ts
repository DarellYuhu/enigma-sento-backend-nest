import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Collection } from './schemas/collection.schema';
import { Model, UpdateQuery } from 'mongoose';
import { People } from './schemas/people.schema';
import { CreatePeopleDto } from './dto/create-people.dto';

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

  async createPeople(createPeopleDto: CreatePeopleDto) {
    try {
      return await this.people.insertMany(createPeopleDto.data);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('People with the same name already exist!');
      }
      throw error;
    }
  }

  findPeople() {
    return this.people.find().lean();
  }

  findOne(id: string) {
    return this.collection.findOne({ _id: id }).lean();
  }

  update(id: string, updateCollectionDto: UpdateCollectionDto) {
    const { newAssets, deletedAssets, ...payload } = updateCollectionDto;
    const updateQuery: UpdateQuery<People> = { ...payload };
    if (deletedAssets?.length > 0) {
      updateQuery.$pull = { assets: { $in: deletedAssets } };
    }
    if (newAssets?.length > 0) {
      updateQuery.$addToSet = { assets: { $each: newAssets } };
    }
    return this.collection
      .findOneAndUpdate({ _id: id }, updateQuery, { new: true })
      .lean();
  }

  remove(id: number) {
    return `This action removes a #${id} collection`;
  }
}
