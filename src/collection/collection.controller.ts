import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CreatePeopleDto } from './dto/create-people.dto';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  async create(@Body() createCollectionDto: CreateCollectionDto) {
    const data = await this.collectionService.create(createCollectionDto);
    return { message: 'success', data };
  }

  @Post('peoples')
  async createPeople(@Body() createPeopleDto: CreatePeopleDto) {
    const data = await this.collectionService.createPeople(createPeopleDto);
    return { message: 'success', data };
  }

  @Get('peoples')
  async findPeople() {
    const data = await this.collectionService.findPeople();
    return { message: 'success', data };
  }

  @Get()
  async findAll(@Query('assetType') assetType: CollectionType) {
    const data = await this.collectionService.findAll({ type: assetType });
    return { message: 'success', data };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    const data = await this.collectionService.update(id, updateCollectionDto);
    return { message: 'ok', data };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectionService.remove(+id);
  }
}
