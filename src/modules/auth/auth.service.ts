/**
 * 认证服务 - 处理用户登录和JWT令牌生成
 */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { Role } from './role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async login(username: string, password: string): Promise<any> {
    let user = await this.userService.findOne({
      where: { username },
      relations: ['roleRef'],
    });

    if (!user) {
      user = await this.userService.create({ username, password });
      user = await this.userService.findOne({
        where: { id: user.id },
        relations: ['roleRef'],
      });
    } else {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new HttpException('密码错误', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    const payload = {
      sub: user.id,
      username: user.username,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.roleRef?.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      data: {
        access_token: token,
        user: {
          id: user.id,
          username: user.username,
          companyId: user.companyId,
          roleId: user.roleId,
          roleName: user.roleRef?.name,
        },
      },
    };
  }

  // Role CRUD
  async findAllRoles() {
    const roles = await this.roleRepo.find({ order: { createdAt: 'ASC' } });
    return roles;
  }

  async createRole(data: Partial<Role>) {
    return this.roleRepo.save(this.roleRepo.create(data));
  }

  async updateRole(id: number, data: Partial<Role>) {
    await this.roleRepo.update(id, data);
    return this.roleRepo.findOne({ where: { id } });
  }

  async deleteRole(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) return { error: '角色不存在' };
    if (role.isDefault) return { error: '系统预置角色不可删除' };
    return this.roleRepo.delete(id);
  }

  // Admin management (using User service with role filter)
  async findAllAdmins(query?: any) {
    const { username, roleId, status, page = 1, pageSize = 10 } = query || {};
    const users = await this.userService.findAll({ username, roleId, status, page, pageSize });
    return users;
  }

  async createAdmin(data: any) {
    return this.userService.create(data);
  }

  async updateAdmin(id: number, data: any) {
    return this.userService.update(id, data);
  }

  async deleteAdmin(id: number) {
    return this.userService.delete(id);
  }

  async resetAdminPassword(id: number, password: string) {
    return this.userService.resetPassword(id, password);
  }
}
