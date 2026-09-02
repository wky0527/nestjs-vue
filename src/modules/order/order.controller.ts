import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('list')
  async findAll(@Query() query: any) {
    return this.orderService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.orderService.getStats();
  }

  @Post('batch-delete')
  async batchDelete(@Body() body: { ids: number[] }) {
    return this.orderService.batchDelete(body.ids);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.orderService.findOne(id);
  }

  @Post('create')
  async create(@Body() body: any) {
    return this.orderService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.orderService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.orderService.delete(id);
  }

  @Post(':id/ship')
  async ship(@Param('id') id: number, @Body() body: { logisticsCompany: string; logisticsNo: string }) {
    return this.orderService.ship(id, body.logisticsCompany, body.logisticsNo);
  }

  // After Sale
  @Get('after-sale/list')
  async findAfterSales(@Query() query: any) {
    return this.orderService.findAfterSales(query);
  }

  @Get('after-sale/stats')
  async getAfterSaleStats() {
    return this.orderService.getAfterSaleStats();
  }

  @Post('after-sale/create')
  async createAfterSale(@Body() body: any) {
    return this.orderService.createAfterSale(body);
  }

  @Put('after-sale/:id/handle')
  async handleAfterSale(@Param('id') id: number, @Body() body: { status: string; handleResult: string }) {
    return this.orderService.handleAfterSale(id, body.status, body.handleResult);
  }

  @Put('after-sale/:id/review')
  async reviewAfterSale(@Param('id') id: number, @Body() body: { action: string; refundAmount?: number; rejectReason?: string; remark?: string }) {
    return this.orderService.reviewAfterSale(id, body.action, body.refundAmount, body.rejectReason, body.remark);
  }

  // Shipping Companies
  @Get('shipping-company/list')
  async findAllShippingCompanies() {
    return this.orderService.findAllShippingCompanies();
  }

  @Post('shipping-company')
  async createShippingCompany(@Body() body: any) {
    return this.orderService.createShippingCompany(body);
  }

  @Put('shipping-company/:id')
  async updateShippingCompany(@Param('id') id: number, @Body() body: any) {
    return this.orderService.updateShippingCompany(id, body);
  }

  @Delete('shipping-company/:id')
  async deleteShippingCompany(@Param('id') id: number) {
    return this.orderService.deleteShippingCompany(id);
  }

  // Shipping Templates
  @Get('shipping-template/list')
  async findAllShippingTemplates() {
    return this.orderService.findAllShippingTemplates();
  }

  @Post('shipping-template')
  async createShippingTemplate(@Body() body: any) {
    return this.orderService.createShippingTemplate(body);
  }

  @Put('shipping-template/:id')
  async updateShippingTemplate(@Param('id') id: number, @Body() body: any) {
    return this.orderService.updateShippingTemplate(id, body);
  }

  @Delete('shipping-template/:id')
  async deleteShippingTemplate(@Param('id') id: number) {
    return this.orderService.deleteShippingTemplate(id);
  }
}
