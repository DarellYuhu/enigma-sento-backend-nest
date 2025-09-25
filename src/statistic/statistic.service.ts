import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Story } from 'src/story/schemas/story.schema';
import { StatisticQueryDto } from './dto/statistic-query.dto';

@Injectable()
export class StatisticService {
  constructor(@InjectModel(Story.name) private story: Model<Story>) {}

  async getOveralPerf({ unit = 'week', since, until }: StatisticQueryDto) {
    const match: PipelineStage = {
      $match: {},
    };
    if (since || until) {
      match.$match.updatedAt = {};
      if (since) {
        match.$match.updatedAt.$gte = since;
      }
      if (until) {
        match.$match.updatedAt.$lte = until;
      }
    }
    const project: {
      _id: { updatedAt: string };
      totalStory: string;
      totalContent: string;
    }[] = await this.story.aggregate([
      match,
      { $match: { generatorStatus: 'FINISHED' } },
      {
        $group: {
          _id: {
            date: { $dateTrunc: { date: '$updatedAt', unit } },
          },
          // totalStory: { $sum: 1 }, // number of finished stories
          totalContent: { $sum: '$contentPerStory' }, // sum of content
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);
    return project;
  }
}
