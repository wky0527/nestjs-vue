import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Message } from './message.entity';
import { MessageTemplate } from './message-template.entity';
import { PushRecord } from './push-record.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(MessageTemplate) private templateRepo: Repository<MessageTemplate>,
    @InjectRepository(PushRecord) private pushRepo: Repository<PushRecord>,
  ) {}

  async findAllMessages(query: any) {
    const { title, type, category, isRead, page = 1, pageSize = 10 } = query;
    const where: any = {};
    if (title) where.title = Like(`%${title}%`);
    if (type) where.type = type;
    if (category) where.category = category;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const [data, total] = await this.messageRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async createMessage(data: Partial<Message>) {
    return this.messageRepo.save(this.messageRepo.create(data));
  }

  async markAsRead(id: number) {
    return this.messageRepo.update(id, { isRead: true });
  }

  async markAllAsRead() {
    return this.messageRepo.update({}, { isRead: true });
  }

  async deleteMessage(id: number) {
    return this.messageRepo.delete(id);
  }

  async batchDelete(ids: number[]) {
    return this.messageRepo.delete(ids);
  }

  async batchMarkRead(ids: number[]) {
    return this.messageRepo.update(ids, { isRead: true });
  }

  async getUnreadCount() {
    const count = await this.messageRepo.count({ where: { isRead: false } });
    return { count };
  }

  // Templates
  async findAllTemplates(query?: any) {
    const { type, triggerEvent, page = 1, pageSize = 10 } = query || {};
    const where: any = {};
    if (type) where.type = type;
    if (triggerEvent) where.triggerEvent = triggerEvent;
    const [data, total] = await this.templateRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async createTemplate(data: Partial<MessageTemplate>) {
    return this.templateRepo.save(this.templateRepo.create(data));
  }

  async updateTemplate(id: number, data: Partial<MessageTemplate>) {
    await this.templateRepo.update(id, data);
    return this.templateRepo.findOne({ where: { id } });
  }

  async deleteTemplate(id: number) {
    return this.templateRepo.delete(id);
  }

  // Push Records
  async findAllPushRecords(query?: any) {
    const { channel, status, keyword, page = 1, pageSize = 10 } = query || {};
    const where: any = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (keyword) where.title = Like(`%${keyword}%`);

    const [data, total] = await this.pushRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async createPushRecord(data: Partial<PushRecord>) {
    return this.pushRepo.save(this.pushRepo.create(data));
  }

  async getPushRecordDetail(id: number) {
    return this.pushRepo.findOne({ where: { id } });
  }

  async retryPushRecord(id: number) {
    const record = await this.pushRepo.findOne({ where: { id } });
    if (!record) return { error: '记录不存在' };
    await this.pushRepo.update(id, { status: 'sending' });
    // Simulate retry
    await this.pushRepo.update(id, { status: 'success', failCount: 0 });
    return this.pushRepo.findOne({ where: { id } });
  }

  async getPushStats() {
    const total = await this.pushRepo.count();
    const success = await this.pushRepo.count({ where: { status: 'success' } });
    const failed = await this.pushRepo.count({ where: { status: 'failed' } });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await this.pushRepo
      .createQueryBuilder('p')
      .where('p.createdAt >= :today', { today: today.toISOString() })
      .getCount();
    return { total, success, failed, todayCount };
  }
}
