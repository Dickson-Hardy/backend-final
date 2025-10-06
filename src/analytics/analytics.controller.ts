import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('editorial/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ASSOCIATE_EDITOR, UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Query('range') range: string = '12months') {
    return this.analyticsService.generateReport(range);
  }

  @Get('export')
  async exportAnalytics(
    @Query('range') range: string = '12months',
    @Res() res: Response,
  ) {
    const data = await this.analyticsService.generateReport(range);
    
    // For now, return JSON. In production, generate PDF using a library like pdfkit
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=analytics-${range}-${Date.now()}.json`,
    );
    
    return res.send(data);
  }
}
