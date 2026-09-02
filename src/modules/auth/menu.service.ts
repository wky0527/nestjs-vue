import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';
import { Button } from './button.entity';
import { Role } from './role.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu) private menuRepo: Repository<Menu>,
    @InjectRepository(Button) private buttonRepo: Repository<Button>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async initializeDefaultRoles() {
    const defaultRoles = [
      { name: 'admin', description: '管理员' },
      { name: 'user', description: '普通用户' },
      { name: 'guest', description: '访客' },
    ];
    for (const roleData of defaultRoles) {
      const existingRole = await this.roleRepo.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        const role = this.roleRepo.create(roleData);
        await this.roleRepo.save(role);
      }
    }
    console.log('默认角色初始化完成');
  }

  async initializeDefaultMenus() {
    const defaultMenus = [
      { name: 'dashboard', title: '首页', path: '/dashboard', component: 'Dashboard', icon: 'HomeFilled', parentId: 0, order: 1, roles: ['admin', 'user'] },
      { name: 'userManagement', title: '用户管理', path: null, component: null, icon: 'User', parentId: 0, order: 2, roles: ['admin', 'user'] },
      { name: 'userList', title: '用户列表', path: '/users', component: 'UserList', icon: 'List', parentId: 2, order: 1, roles: ['admin', 'user'] },
      { name: 'userLevels', title: '会员等级', path: '/users/levels', component: 'UserLevels', icon: 'Trophy', parentId: 2, order: 2, roles: ['admin'] },
      { name: 'userBlacklist', title: '黑名单', path: '/users/blacklist', component: 'UserBlacklist', icon: 'RemoveFilled', parentId: 2, order: 3, roles: ['admin'] },
      { name: 'orderManagement', title: '订单管理', path: null, component: null, icon: 'ShoppingCart', parentId: 0, order: 3, roles: ['admin', 'user'] },
      { name: 'cart', title: '购物车', path: '/cart', component: 'Cart', icon: 'ShoppingCart', parentId: 6, order: 0, roles: ['admin', 'user'] },
      { name: 'orderList', title: '订单列表', path: '/orders', component: 'OrderList', icon: 'List', parentId: 6, order: 1, roles: ['admin', 'user'] },
      { name: 'orderAfterSales', title: '售后管理', path: '/orders/after-sales', component: 'OrderAfterSales', icon: 'Service', parentId: 6, order: 2, roles: ['admin'] },
      { name: 'orderLogistics', title: '物流设置', path: '/orders/logistics', component: 'OrderLogistics', icon: 'Van', parentId: 6, order: 3, roles: ['admin'] },
      { name: 'productManagement', title: '商品管理', path: null, component: null, icon: 'Box', parentId: 0, order: 4, roles: ['admin', 'user'] },
      { name: 'productList', title: '商品列表', path: '/products', component: 'ProductList', icon: 'List', parentId: 10, order: 1, roles: ['admin', 'user'] },
      { name: 'productCategories', title: '分类管理', path: '/products/categories', component: 'ProductCategories', icon: 'Menu', parentId: 10, order: 2, roles: ['admin'] },
      { name: 'productBrands', title: '品牌管理', path: '/products/brands', component: 'ProductBrands', icon: 'Collection', parentId: 10, order: 3, roles: ['admin'] },
      { name: 'productAttributes', title: '规格属性', path: '/products/attributes', component: 'ProductAttributes', icon: 'Setting', parentId: 10, order: 4, roles: ['admin'] },
      { name: 'contentManagement', title: '内容管理', path: null, component: null, icon: 'Document', parentId: 0, order: 5, roles: ['admin', 'user'] },
      { name: 'contentArticles', title: '文章列表', path: '/content', component: 'ContentArticles', icon: 'List', parentId: 15, order: 1, roles: ['admin', 'user'] },
      { name: 'contentCategories', title: '分类管理', path: '/content/categories', component: 'ContentCategories', icon: 'Menu', parentId: 15, order: 2, roles: ['admin'] },
      { name: 'contentAds', title: '广告位', path: '/content/ads', component: 'ContentAds', icon: 'Picture', parentId: 15, order: 3, roles: ['admin'] },
      { name: 'contentAnnouncements', title: '公告', path: '/content/announcements', component: 'ContentAnnouncements', icon: 'Bell', parentId: 15, order: 4, roles: ['admin'] },
      { name: 'statistics', title: '数据统计', path: null, component: null, icon: 'DataLine', parentId: 0, order: 6, roles: ['admin'] },
      { name: 'statsVisit', title: '访问分析', path: '/stats', component: 'StatsVisit', icon: 'View', parentId: 20, order: 1, roles: ['admin'] },
      { name: 'statsSales', title: '销售报表', path: '/stats/sales', component: 'StatsSales', icon: 'TrendCharts', parentId: 20, order: 2, roles: ['admin'] },
      { name: 'statsUsers', title: '用户画像', path: '/stats/users', component: 'StatsUsers', icon: 'UserFilled', parentId: 20, order: 3, roles: ['admin'] },
      { name: 'messageCenter', title: '消息中心', path: null, component: null, icon: 'Bell', parentId: 0, order: 7, roles: ['admin', 'user'] },
      { name: 'messageInbox', title: '站内信', path: '/messages', component: 'MessageInbox', icon: 'ChatDotRound', parentId: 24, order: 1, roles: ['admin', 'user'] },
      { name: 'messageTemplates', title: '通知模板', path: '/messages/templates', component: 'MessageTemplates', icon: 'Document', parentId: 24, order: 2, roles: ['admin'] },
      { name: 'messagePush', title: '推送记录', path: '/messages/push', component: 'MessagePush', icon: 'Promotion', parentId: 24, order: 3, roles: ['admin'] },
      { name: 'permissionManagement', title: '权限管理', path: null, component: null, icon: 'Lock', parentId: 0, order: 8, roles: ['admin'] },
      { name: 'permissionRoles', title: '角色管理', path: '/permissions/roles', component: 'PermissionRoles', icon: 'UserFilled', parentId: 28, order: 1, roles: ['admin'] },
      { name: 'permissionMenus', title: '菜单权限', path: '/permissions/menus', component: 'PermissionMenus', icon: 'Menu', parentId: 28, order: 2, roles: ['admin'] },
      { name: 'permissionAdmins', title: '管理员列表', path: '/permissions/admins', component: 'PermissionAdmins', icon: 'User', parentId: 28, order: 3, roles: ['admin'] },
      { name: 'systemSettings', title: '系统设置', path: null, component: null, icon: 'Setting', parentId: 0, order: 9, roles: ['admin'] },
      { name: 'settingsBasic', title: '基本设置', path: '/settings/basic', component: 'SettingsBasic', icon: 'Setting', parentId: 32, order: 1, roles: ['admin'] },
      { name: 'settingsSecurity', title: '安全设置', path: '/settings/security', component: 'SettingsSecurity', icon: 'Lock', parentId: 32, order: 2, roles: ['admin'] },
      { name: 'settingsNotification', title: '通知配置', path: '/settings/notification', component: 'SettingsNotification', icon: 'Bell', parentId: 32, order: 3, roles: ['admin'] },
      { name: 'settingsLogs', title: '日志管理', path: '/settings/logs', component: 'SettingsLogs', icon: 'Document', parentId: 32, order: 4, roles: ['admin'] },
    ];

    const existingMenus = await this.menuRepo.find();
    if (existingMenus.length > 0) {
      console.log('菜单已存在，跳过初始化');
      return;
    }

    for (const menuData of defaultMenus) {
      const menu = this.menuRepo.create(menuData);
      await this.menuRepo.save(menu);
    }
    console.log('默认菜单初始化完成');
  }

  async initializeDefaultButtons() {
    const defaultButtons = [
      { name: 'userCreate', title: '新增用户', action: 'create', menuId: 3, roles: ['admin'] },
      { name: 'userEdit', title: '编辑用户', action: 'edit', menuId: 3, roles: ['admin', 'user'] },
      { name: 'userDelete', title: '删除用户', action: 'delete', menuId: 3, roles: ['admin'] },
      { name: 'userBlacklist', title: '拉黑用户', action: 'blacklist', menuId: 5, roles: ['admin'] },
      { name: 'orderCreate', title: '创建订单', action: 'create', menuId: 7, roles: ['admin', 'user'] },
      { name: 'orderShip', title: '发货', action: 'ship', menuId: 7, roles: ['admin'] },
      { name: 'orderRefund', title: '退款', action: 'refund', menuId: 7, roles: ['admin'] },
      { name: 'productCreate', title: '新增商品', action: 'create', menuId: 11, roles: ['admin'] },
      { name: 'productEdit', title: '编辑商品', action: 'edit', menuId: 11, roles: ['admin'] },
      { name: 'productToggle', title: '上下架', action: 'toggle', menuId: 11, roles: ['admin'] },
      { name: 'articleCreate', title: '发布文章', action: 'create', menuId: 16, roles: ['admin'] },
      { name: 'articleEdit', title: '编辑文章', action: 'edit', menuId: 16, roles: ['admin'] },
      { name: 'messageSend', title: '发送消息', action: 'send', menuId: 25, roles: ['admin'] },
      { name: 'roleCreate', title: '新增角色', action: 'create', menuId: 29, roles: ['admin'] },
      { name: 'roleEdit', title: '编辑角色', action: 'edit', menuId: 29, roles: ['admin'] },
    ];

    const existingButtons = await this.buttonRepo.find();
    if (existingButtons.length > 0) {
      console.log('按钮已存在，跳过初始化');
      return;
    }

    for (const buttonData of defaultButtons) {
      const button = this.buttonRepo.create(buttonData);
      await this.buttonRepo.save(button);
    }
    console.log('默认按钮初始化完成');
  }
}
