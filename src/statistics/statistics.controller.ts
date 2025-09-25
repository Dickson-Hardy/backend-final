import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { StatisticsService, JournalStatistics } from './statistics.service'

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('journal')
  @ApiOperation({ summary: 'Get journal statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Journal statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalArticles: { type: 'number', example: 2500 },
        totalCountries: { type: 'number', example: 150 },
        impactFactor: { type: 'number', example: 4.2 },
        totalVolumes: { type: 'number', example: 25 },
        totalUsers: { type: 'number', example: 5000 },
      }
    }
  })
  async getJournalStatistics(): Promise<JournalStatistics> {
    return this.statisticsService.getJournalStatistics()
  }
}
