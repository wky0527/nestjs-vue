import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { MemberLevel } from './member-level.entity';
import { Blacklist } from './blacklist.entity';
import { LoginLog } from './login-log.entity';
import { Repository, Like, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(MemberLevel) private levelRepo: Repository<MemberLevel>,
    @InjectRepository(Blacklist) private blacklistRepo: Repository<Blacklist>,
    @InjectRepository(LoginLog) private loginLogRepo: Repository<LoginLog>,
  ) {}

  async create(data: Partial<User>) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    const user = this.userRepo.create({ ...data, password: hashedPassword });
    return this.userRepo.save(user);
  }

  async findAll(query?: any) {
    const { username, phone, level, isBlacklisted, status, page, pageSize } = query || {};
    const where: any = {};
    if (username) where.username = Like(`%${username}%`);
    if (phone) where.phone = Like(`%${phone}%`);
    if (level) where.level = level;
    if (status) where.status = status;
    if (isBlacklisted !== undefined) where.isBlacklisted = isBlacklisted === 'true';

    if (page && pageSize) {
      const [data, total] = await this.userRepo.findAndCount({
        where,
        relations: ['roleRef'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return { data, total, page: Number(page), pageSize: Number(pageSize) };
    }

    return this.userRepo.find({ where, relations: ['roleRef'] });
  }

  async findOne(options: any) {
    return this.userRepo.findOne(options);
  }

  async update(id: number, data: Partial<User>) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id }, relations: ['roleRef'] });
  }

  async delete(id: number) {
    return this.userRepo.delete(id);
  }

  async updateLevel(id: number, level: string) {
    return this.userRepo.update(id, { level });
  }

  async toggleBlacklist(id: number, isBlacklisted: boolean, reason?: string) {
    return this.userRepo.update(id, { isBlacklisted, blacklistReason: reason || null });
  }

  async resetPassword(id: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.userRepo.update(id, { password: hashedPassword });
  }

  async updateRole(id: number, roleId: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('用户不存在');
    await this.userRepo.update(id, { roleId });
    return this.userRepo.findOne({ where: { id }, relations: ['roleRef'] });
  }

  async batchUpdate(ids: number[], data: Partial<User>) {
    for (const id of ids) {
      await this.userRepo.update(id, data);
    }
    return { success: true };
  }

  async getStats() {
    const total = await this.userRepo.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNew = await this.userRepo.count({ where: { createdAt: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })() } as any });
    const male = await this.userRepo.count({ where: { gender: 'male' } });
    const female = await this.userRepo.count({ where: { gender: 'female' } });
    const active = await this.userRepo.count({ where: { status: 'active' } });
    return { total, todayNew, male, female, unknown: total - male - female, active };
  }

  async getLoginLogs(userId: number) {
    return this.loginLogRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  // Member Levels
  async findAllLevels() {
    return this.levelRepo.find({ order: { order: 'ASC' } });
  }

  async createLevel(data: Partial<MemberLevel>) {
    return this.levelRepo.save(this.levelRepo.create(data));
  }

  async updateMemberLevel(id: number, data: Partial<MemberLevel>) {
    await this.levelRepo.update(id, data);
    return this.levelRepo.findOne({ where: { id } });
  }

  async deleteLevel(id: number) {
    const level = await this.levelRepo.findOne({ where: { id } });
    if (!level) return { error: '等级不存在' };
    const userCount = await this.userRepo.count({ where: { level: level.name } });
    if (userCount > 0) return { error: `该等级下有${userCount}名用户，无法删除，请先迁移用户。` };
    return this.levelRepo.delete(id);
  }

  // Blacklist management
  async findBlacklist(query?: any) {
    const { username, phone, page = 1, pageSize = 10 } = query || {};
    const where: any = { isActive: true };
    if (username) where.username = Like(`%${username}%`);
    if (phone) where.phone = Like(`%${phone}%`);

    const [data, total] = await this.blacklistRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async addToBlacklist(data: Partial<Blacklist>) {
    const record = this.blacklistRepo.create(data);
    await this.blacklistRepo.save(record);
    // Also update user status
    await this.userRepo.update(data.userId, { isBlacklisted: true, blacklistReason: data.reason });
    return record;
  }

  async unblockFromBlacklist(id: number) {
    const record = await this.blacklistRepo.findOne({ where: { id } });
    if (!record) return { error: '记录不存在' };
    await this.blacklistRepo.update(id, { isActive: false });
    await this.userRepo.update(record.userId, { isBlacklisted: false, blacklistReason: null });
    return { success: true };
  }
}
