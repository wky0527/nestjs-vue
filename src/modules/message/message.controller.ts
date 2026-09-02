import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get('list')
  async findAllMessages(@Query() query: any) {
    return this.messageService.findAllMessages(query);
  }

  @Post('create')
  async createMessage(@Body() body: any) {
    return this.messageService.createMessage(body);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: number) {
    return this.messageService.markAsRead(id);
  }

  @Put('read-all')
  async markAllAsRead() {
    return this.messageService.markAllAsRead();
  }

  @Post('batch-read')
  async batchMarkRead(@Body() body: { ids: number[] }) {
    return this.messageService.batchMarkRead(body.ids);
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: number) {
    return this.messageService.deleteMessage(id);
  }

  @Post('batch-delete')
  async batchDelete(@Body() body: { ids: number[] }) {
    return this.messageService.batchDelete(body.ids);
  }

  @Get('unread-count')
  async getUnreadCount() {
    return this.messageService.getUnreadCount();
  }

  // Templates
  @Get('template/list')
  async findAllTemplates(@Query() query: any) {
    return this.messageService.findAllTemplates(query);
  }

  @Post('template/create')
  async createTemplate(@Body() body: any) {
    return this.messageService.createTemplate(body);
  }

  @Put('template/:id')
  async updateTemplate(@Param('id') id: number, @Body() body: any) {
    return this.messageService.updateTemplate(id, body);
  }

  @Delete('template/:id')
  async deleteTemplate(@Param('id') id: number) {
    return this.messageService.deleteTemplate(id);
  }

  // Push Records
  @Get('push/list')
  async findAllPushRecords(@Query() query: any) {
    return this.messageService.findAllPushRecords(query);
  }

  @Get('push/stats')
  async getPushStats() {
    return this.messageService.getPushStats();
  }

  @Get('push/:id')
  async getPushDetail(@Param('id') id: number) {
    return this.messageService.getPushRecordDetail(id);
  }

  @Post('push/create')
  async createPushRecord(@Body() body: any) {
    return this.messageService.createPushRecord(body);
  }

  @Post('push/:id/retry')
  async retryPush(@Param('id') id: number) {
    return this.messageService.retryPushRecord(id);
  }
}
