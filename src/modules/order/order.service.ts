import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order } from './order.entity';
import { AfterSale } from './after-sale.entity';
import { ShippingCompany } from './shipping-company.entity';
import { ShippingTemplate } from './shipping-template.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(AfterSale) private afterSaleRepo: Repository<AfterSale>,
    @InjectRepository(ShippingCompany) private shippingCompanyRepo: Repository<ShippingCompany>,
    @InjectRepository(ShippingTemplate) private shippingTemplateRepo: Repository<ShippingTemplate>,
  ) {}

  async findAll(query: any) {
    const { status, orderNo, userName, productName, paymentMethod, page = 1, pageSize = 10 } = query;
    const where: any = {};
    if (status) where.status = status;
    if (orderNo) where.orderNo = Like(`%${orderNo}%`);
    if (userName) where.userName = Like(`%${userName}%`);
    if (productName) where.productName = Like(`%${productName}%`);
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const [data, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: number) {
    return this.orderRepo.findOne({ where: { id } });
  }

  async create(data: Partial<Order>) {
    if (!data.orderNo) data.orderNo = 'ORD' + Date.now();
    const order = this.orderRepo.create(data);
    return this.orderRepo.save(order);
  }

  async update(id: number, data: Partial<Order>) {
    await this.orderRepo.update(id, data);
    return this.orderRepo.findOne({ where: { id } });
  }

  async delete(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) return { error: '订单不存在' };
    if (!['已取消', '已完成'].includes(order.status)) return { error: '仅允许删除已取消或已完成的订单' };
    return this.orderRepo.delete(id);
  }

  async batchDelete(ids: number[]) {
    for (const id of ids) {
      await this.delete(id);
    }
    return { success: true };
  }

  async ship(id: number, logisticsCompany: string, logisticsNo: string) {
    return this.orderRepo.update(id, { status: '已发货', logisticsCompany, logisticsNo });
  }

  async getStats() {
    const total = await this.orderRepo.count();
    const pending = await this.orderRepo.count({ where: { status: '待付款' } });
    const paid = await this.orderRepo.count({ where: { status: '已付款' } });
    const shipped = await this.orderRepo.count({ where: { status: '已发货' } });
    const completed = await this.orderRepo.count({ where: { status: '已完成' } });
    const cancelled = await this.orderRepo.count({ where: { status: '已取消' } });
    return { total, pending, paid, shipped, completed, cancelled };
  }

  // After Sale
  async findAfterSales(query: any) {
    const { status, type, orderNo, userName, page = 1, pageSize = 10 } = query;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (orderNo) where.orderNo = Like(`%${orderNo}%`);
    if (userName) where.userName = Like(`%${userName}%`);

    const [data, total] = await this.afterSaleRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async createAfterSale(data: Partial<AfterSale>) {
    const afterSale = this.afterSaleRepo.create(data);
    return this.afterSaleRepo.save(afterSale);
  }

  async handleAfterSale(id: number, status: string, handleResult: string) {
    return this.afterSaleRepo.update(id, { status, handleResult });
  }

  async reviewAfterSale(id: number, action: string, refundAmount?: number, rejectReason?: string, remark?: string) {
    if (action === 'approve') {
      await this.afterSaleRepo.update(id, { status: '审核通过', refundAmount: refundAmount || 0, handleResult: remark || '审核通过' });
    } else {
      await this.afterSaleRepo.update(id, { status: '已拒绝', rejectReason, handleResult: remark || '审核拒绝' });
    }
    return this.afterSaleRepo.findOne({ where: { id } });
  }

  async getAfterSaleStats() {
    const pending = await this.afterSaleRepo.count({ where: { status: '待处理' } });
    const processing = await this.afterSaleRepo.count({ where: { status: '处理中' } });
    const completed = await this.afterSaleRepo.count({ where: { status: '已完成' } });
    const rejected = await this.afterSaleRepo.count({ where: { status: '已拒绝' } });
    const total = pending + processing + completed + rejected;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { pending, processing, completed, rejected, total, completionRate: rate };
  }

  // Shipping Companies
  async findAllShippingCompanies() {
    return this.shippingCompanyRepo.find({ order: { order: 'ASC' } });
  }

  async createShippingCompany(data: Partial<ShippingCompany>) {
    return this.shippingCompanyRepo.save(this.shippingCompanyRepo.create(data));
  }

  async updateShippingCompany(id: number, data: Partial<ShippingCompany>) {
    await this.shippingCompanyRepo.update(id, data);
    return this.shippingCompanyRepo.findOne({ where: { id } });
  }

  async deleteShippingCompany(id: number) {
    return this.shippingCompanyRepo.delete(id);
  }

  // Shipping Templates
  async findAllShippingTemplates() {
    return this.shippingTemplateRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createShippingTemplate(data: Partial<ShippingTemplate>) {
    return this.shippingTemplateRepo.save(this.shippingTemplateRepo.create(data));
  }

  async updateShippingTemplate(id: number, data: Partial<ShippingTemplate>) {
    await this.shippingTemplateRepo.update(id, data);
    return this.shippingTemplateRepo.findOne({ where: { id } });
  }

  async deleteShippingTemplate(id: number) {
    return this.shippingTemplateRepo.delete(id);
  }
}
