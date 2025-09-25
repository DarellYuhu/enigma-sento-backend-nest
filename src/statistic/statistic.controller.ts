import { Controller, Get, Query } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticQueryDto } from './dto/statistic-query.dto';

@Controller('statistics')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('overall')
  getOveralPerf(@Query() query: StatisticQueryDto) {
    return this.statisticService.getOveralPerf(query);
  }
}
