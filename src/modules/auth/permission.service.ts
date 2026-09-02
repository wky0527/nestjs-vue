import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { Menu } from './menu.entity';
import { Button } from './button.entity';
import { User } from '../user/user.entity';

/**
 * 权限服务类
 * 提供用户权限管理的各种方法
 * 包括菜单权限、按钮权限的获取和分配
 */
@Injectable()
export class PermissionService {
  /**
   * 构造函数 - 注入数据库仓库
   * @param permissionRepo - 权限仓库
   * @param roleRepo - 角色仓库
   * @param rolePermissionRepo - 角色权限关联仓库
   * @param menuRepo - 菜单仓库
   * @param buttonRepo - 按钮仓库
   * @param userRepo - 用户仓库
   */
  constructor(
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(RolePermission) private rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(Menu) private menuRepo: Repository<Menu>,
    @InjectRepository(Button) private buttonRepo: Repository<Button>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /**
   * 为角色分配权限
   * @param roleId - 角色ID
   * @param permissionId - 权限ID
   * @returns 分配结果
   */
  async assignPermissionToRole(roleId: number, permissionId: number) {
    // 创建角色权限关联对象
    const rolePermission = this.rolePermissionRepo.create({
      role: { id: roleId } as Role,      // 构建角色对象
      permission: { id: permissionId } as Permission, // 构建权限对象
    });
    
    // 保存关联关系到数据库
    return await this.rolePermissionRepo.save(rolePermission);
  }

  /**
   * 获取角色的所有权限
   * @param roleId - 角色ID
   * @returns 权限列表
   */
  async getRolePermissions(roleId: number) {
    // 查询角色权限关联表，包含权限详情
    return await this.rolePermissionRepo.find({
      where: { role: { id: roleId } },    // 查询条件：指定角色ID
      relations: ['permission'],          // 关联查询权限信息
    });
  }

  /**
   * 获取用户的所有权限
   * @param userId - 用户ID
   * @returns 权限列表
   */
  async getUserPermissions(userId: number) {
    // 查询用户及其角色和权限信息
    const user = await this.userRepo.findOne({
      where: { id: userId },              // 查询条件：指定用户ID
      relations: ['roleRef', 'roleRef.rolePermissions', 'roleRef.rolePermissions.permission'], // 关联查询角色和权限
    });
    
    // 如果用户或角色不存在，返回空数组
    if (!user || !user.roleRef) {
      return [];
    }
    
    // 返回用户角色的所有权限
    return user.roleRef.rolePermissions.map(rp => rp.permission);
  }

  /**
   * 获取用户的菜单权限
   * @param userId - 用户ID
   * @returns 菜单树结构
   */
  async getUserMenus(userId: number) {
    // 获取用户信息（包含角色）
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roleRef'],
    });
    
    // 如果用户或角色不存在，返回空数组
    if (!user || !user.roleRef) {
      return [];
    }
    
    // 查询所有启用且可见的菜单
    const menus = await this.menuRepo.find({
      where: {
        enabled: true,     // 只查询启用的菜单
        visible: true,     // 只查询可见的菜单
      },
      order: {
        parentId: 'ASC',  // 按父级ID升序排列
        order: 'ASC',     // 按排序字段升序排列
      },
    });
    
    // 获取用户角色名
    const userRole = user.roleRef.name;
    
    // 根据用户角色过滤有权限的菜单
    const accessibleMenus = menus.filter(menu => 
      !menu.roles || menu.roles.length === 0 || menu.roles.includes(userRole)
    );
    
    // 构建菜单树并返回
    return this.buildMenuTree(accessibleMenus, 0);
  }

  /**
   * 构建菜单树结构（递归方法）
   * @param menus - 所有菜单数组
   * @param parentId - 父级菜单ID
   * @returns 菜单树结构
   */
  private buildMenuTree(menus: Menu[], parentId: number) {
    // 筛选出指定父级ID的菜单项
    return menus
      .filter(menu => menu.parentId === parentId)  // 筛选子菜单
      .map(menu => ({
        ...menu,                                  // 展开菜单属性
        children: this.buildMenuTree(menus, menu.id), // 递归构建子菜单树
      }));
  }

  /**
   * 获取用户的按钮权限
   * @param userId - 用户ID
   * @param menuId - 菜单ID（可选）
   * @returns 按钮权限列表
   */
  async getUserButtons(userId: number, menuId?: number) {
    // 获取用户信息（包含角色）
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roleRef'],
    });
    
    // 如果用户或角色不存在，返回空数组
    if (!user || !user.roleRef) {
      return [];
    }
    
    // 构建查询条件
    const whereCondition: any = { enabled: true }; // 只查询启用的按钮
    if (menuId) {
      whereCondition.menuId = menuId;             // 如果指定了菜单ID，只查询该菜单下的按钮
    }
    
    // 查询符合条件的按钮
    const buttons = await this.buttonRepo.find({
      where: whereCondition,
    });
    
    // 获取用户角色名
    const userRole = user.roleRef.name;
    
    // 根据用户角色过滤有权限的按钮
    return buttons.filter(button => 
      !button.roles || button.roles.length === 0 || button.roles.includes(userRole)
    );
  }

  /**
   * 为角色分配菜单权限
   * @param roleId - 角色ID
   * @param menuIds - 菜单ID数组
   * @returns 分配结果
   */
  async assignMenuToRole(roleId: number, menuIds: number[]) {
    // 查询角色是否存在
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new Error('角色不存在');
    }
    
    // 查询要分配的菜单
    const menus = await this.menuRepo.find({
      where: { id: In(menuIds) },  // 使用In操作符查询多个ID
    });
    
    // 为每个菜单添加角色权限
    for (const menu of menus) {
      menu.roles = menu.roles || [];              // 初始化角色数组
      if (!menu.roles.includes(role.name)) {      // 避免重复添加
        menu.roles.push(role.name);               // 添加角色名到权限数组
      }
      await this.menuRepo.save(menu);             // 保存菜单权限
    }
    
    return menus;
  }

  /**
   * 为角色分配按钮权限
   * @param roleId - 角色ID
   * @param buttonIds - 按钮ID数组
   * @returns 分配结果
   */
  async assignButtonToRole(roleId: number, buttonIds: number[]) {
    // 查询角色是否存在
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new Error('角色不存在');
    }
    
    // 查询要分配的按钮
    const buttons = await this.buttonRepo.find({
      where: { id: In(buttonIds) },  // 使用In操作符查询多个ID
    });
    
    // 为每个按钮添加角色权限
    for (const button of buttons) {
      button.roles = button.roles || [];          // 初始化角色数组
      if (!button.roles.includes(role.name)) {    // 避免重复添加
        button.roles.push(role.name);             // 添加角色名到权限数组
      }
      await this.buttonRepo.save(button);         // 保存按钮权限
    }
    
    return buttons;
  }

  /**
   * 获取所有菜单（不区分权限）
   * @returns 完整菜单树
   */
  async getAllMenus() {
    // 查询所有菜单，按层级和排序排列
    const menus = await this.menuRepo.find({
      order: {
        parentId: 'ASC',  // 按父级ID升序
        order: 'ASC',     // 按排序字段升序
      },
    });
    
    // 构建菜单树并返回
    return this.buildMenuTree(menus, 0);
  }

  /**
   * 获取指定菜单下的所有按钮
   * @param menuId - 菜单ID
   * @returns 按钮列表
   */
  async getButtonsByMenu(menuId: number) {
    // 查询指定菜单下的所有启用按钮
    return await this.buttonRepo.find({
      where: { menuId, enabled: true },
    });
  }
}