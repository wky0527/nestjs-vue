import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('dashboard')
  async getDashboard() {
    return this.statisticsService.getDashboard();
  }

  @Get('visit')
  async getVisitAnalysis(@Query('period') period: string) {
    return this.statisticsService.getVisitAnalysis(period || 'week');
  }

  @Get('sales')
  async getSalesReport(@Query('period') period: string) {
    return this.statisticsService.getSalesReport(period || 'month');
  }

  @Get('user-profile')
  async getUserProfile(@Query('period') period: string) {
    return this.statisticsService.getUserProfile(period || '30d');
  }

  @Get('sales-report')
  async getSalesReportRaw() {
    return this.statisticsService.getSalesReportRaw();
  }

  @Get('user-level')
  async getUserLevelStats() {
    return this.statisticsService.getUserLevelStats();
  }

  @Get('order-status')
  async getOrderStatusStats() {
    return this.statisticsService.getOrderStatusStats();
  }
}
