import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan } from 'typeorm';
import { SystemSetting } from './system-setting.entity';
import { SystemLog } from './system-log.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting) private settingRepo: Repository<SystemSetting>,
    @InjectRepository(SystemLog) private logRepo: Repository<SystemLog>,
  ) {}

  async findAllSettings(group?: string) {
    const where: any = {};
    if (group) where.group = group;
    return this.settingRepo.find({ where });
  }

  async getSetting(key: string) {
    return this.settingRepo.findOne({ where: { key } });
  }

  async updateSetting(key: string, value: string) {
    const existing = await this.settingRepo.findOne({ where: { key } });
    if (existing) {
      await this.settingRepo.update({ key }, { value });
    } else {
      await this.settingRepo.save(this.settingRepo.create({ key, value }));
    }
    return this.settingRepo.findOne({ where: { key } });
  }

  async batchUpdateSettings(settings: { key: string; value: string }[]) {
    for (const s of settings) {
      await this.updateSetting(s.key, s.value);
    }
    return this.findAllSettings();
  }

  // Logs
  async findAllLogs(query: any) {
    const { username, module, type, level, ip, keyword, page = 1, pageSize = 20 } = query;
    const where: any = {};
    if (username) where.username = Like(`%${username}%`);
    if (module) where.module = module;
    if (type) where.type = type;
    if (level) where.level = level;
    if (ip) where.ip = Like(`%${ip}%`);
    if (keyword) where.action = Like(`%${keyword}%`);

    const [data, total] = await this.logRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async createLog(data: Partial<SystemLog>) {
    return this.logRepo.save(this.logRepo.create(data));
  }

  async cleanupLogs(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.logRepo.delete({ createdAt: (() => { const d = new Date(); d.setDate(d.getDate() - days); return d; })() } as any);
  }

  async getLogStats() {
    const total = await this.logRepo.count();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await this.logRepo
      .createQueryBuilder('l')
      .where('l.createdAt >= :today', { today: today.toISOString() })
      .getCount();
    const errorCount = await this.logRepo.count({ where: { level: 'ERROR' } });
    return { total, todayCount, errorCount };
  }
}
