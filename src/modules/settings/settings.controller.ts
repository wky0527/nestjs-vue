import { Controller, Get, Put, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('list')
  async findAllSettings(@Query('group') group?: string) {
    return this.settingsService.findAllSettings(group);
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Put(':key')
  async updateSetting(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settingsService.updateSetting(key, body.value);
  }

  @Put('batch')
  async batchUpdateSettings(@Body() body: { settings: { key: string; value: string }[] }) {
    return this.settingsService.batchUpdateSettings(body.settings);
  }

  // Logs
  @Get('log/list')
  async findAllLogs(@Query() query: any) {
    return this.settingsService.findAllLogs(query);
  }

  @Get('log/stats')
  async getLogStats() {
    return this.settingsService.getLogStats();
  }

  @Post('log/create')
  async createLog(@Body() body: any) {
    return this.settingsService.createLog(body);
  }

  @Delete('log/cleanup')
  async cleanupLogs(@Query('days') days: number) {
    return this.settingsService.cleanupLogs(days || 180);
  }
}
