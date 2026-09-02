import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './modules/user/user.entity';
import { MemberLevel } from './modules/user/member-level.entity';
import { Blacklist } from './modules/user/blacklist.entity';
import { LoginLog } from './modules/user/login-log.entity';
import { Role } from './modules/auth/role.entity';
import { Menu } from './modules/auth/menu.entity';
import { Button } from './modules/auth/button.entity';
import { Order } from './modules/order/order.entity';
import { AfterSale } from './modules/order/after-sale.entity';
import { ShippingCompany } from './modules/order/shipping-company.entity';
import { ShippingTemplate } from './modules/order/shipping-template.entity';
import { CartItem } from './modules/order/cart-item.entity';
import { Product } from './modules/product/product.entity';
import { ProductCategory } from './modules/product/product-category.entity';
import { ProductBrand } from './modules/product/product-brand.entity';
import { ProductSpec } from './modules/product/product-spec.entity';
import { Article } from './modules/content/article.entity';
import { ContentCategory } from './modules/content/content-category.entity';
import { Ad } from './modules/content/ad.entity';
import { AdPosition } from './modules/content/ad-position.entity';
import { Announcement } from './modules/content/announcement.entity';
import { Message } from './modules/message/message.entity';
import { MessageTemplate } from './modules/message/message-template.entity';
import { PushRecord } from './modules/message/push-record.entity';
import { SystemSetting } from './modules/settings/system-setting.entity';
import { SystemLog } from './modules/settings/system-log.entity';

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d;
}

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(MemberLevel) private levelRepo: Repository<MemberLevel>,
    @InjectRepository(Blacklist) private blRepo: Repository<Blacklist>,
    @InjectRepository(LoginLog) private logRepo: Repository<LoginLog>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Menu) private menuRepo: Repository<Menu>,
    @InjectRepository(Button) private buttonRepo: Repository<Button>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(AfterSale) private asRepo: Repository<AfterSale>,
    @InjectRepository(ShippingCompany) private scRepo: Repository<ShippingCompany>,
    @InjectRepository(ShippingTemplate) private stRepo: Repository<ShippingTemplate>,
    @InjectRepository(CartItem) private cartRepo: Repository<CartItem>,
    @InjectRepository(Product) private prodRepo: Repository<Product>,
    @InjectRepository(ProductCategory) private catRepo: Repository<ProductCategory>,
    @InjectRepository(ProductBrand) private brandRepo: Repository<ProductBrand>,
    @InjectRepository(ProductSpec) private specRepo: Repository<ProductSpec>,
    @InjectRepository(Article) private artRepo: Repository<Article>,
    @InjectRepository(ContentCategory) private ccRepo: Repository<ContentCategory>,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(AdPosition) private apRepo: Repository<AdPosition>,
    @InjectRepository(Announcement) private annRepo: Repository<Announcement>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(MessageTemplate) private mtRepo: Repository<MessageTemplate>,
    @InjectRepository(PushRecord) private prRepo: Repository<PushRecord>,
    @InjectRepository(SystemSetting) private ssRepo: Repository<SystemSetting>,
    @InjectRepository(SystemLog) private slRepo: Repository<SystemLog>,
  ) {}

  async seedAll() {
    console.log('🌱 开始检查种子数据...');

    // 1. 角色（检查是否已有种子角色）
    const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      const roles = this.roleRepo.create([
        { name: 'admin', code: 'admin', description: '超级管理员，拥有系统全部权限', isDefault: false, enabled: true },
        { name: 'operator', code: 'operator', description: '运营管理员，负责日常运营管理', isDefault: false, enabled: true },
        { name: 'editor', code: 'editor', description: '内容编辑，负责内容发布和编辑', isDefault: false, enabled: true },
        { name: 'support', code: 'support', description: '客服，处理用户咨询和售后', isDefault: false, enabled: true },
        { name: 'user', code: 'user', description: '普通用户，注册用户默认角色', isDefault: true, enabled: true },
      ]);
      await this.roleRepo.save(roles);
      console.log(`✅ 角色: ${roles.length}条`);
    } else if (!await this.roleRepo.findOne({ where: { name: 'operator' } })) {
      // admin 存在但 operator 不存在，说明只有 MenuService 初始化过，补充缺失角色
      const extraRoles = this.roleRepo.create([
        { name: 'operator', code: 'operator', description: '运营管理员，负责日常运营管理', isDefault: false, enabled: true },
        { name: 'editor', code: 'editor', description: '内容编辑，负责内容发布和编辑', isDefault: false, enabled: true },
        { name: 'support', code: 'support', description: '客服，处理用户咨询和售后', isDefault: false, enabled: true },
      ]);
      await this.roleRepo.save(extraRoles);
      console.log(`✅ 补充角色: ${extraRoles.length}条`);
    }
    const allRoles = await this.roleRepo.find();

    // 1.5 补充购物车菜单（如果不存在）
    const cartMenu = await this.menuRepo.findOne({ where: { name: 'cart' } });
    if (!cartMenu) {
      // 找到“订单管理”父菜单
      const orderParent = await this.menuRepo.findOne({ where: { name: 'orderManagement' } });
      const parentId = orderParent?.id || 6;
      await this.menuRepo.save(this.menuRepo.create({
        name: 'cart', title: '购物车', path: '/cart', component: 'Cart',
        icon: 'ShoppingCart', parentId, order: 0, roles: ['admin', 'user'],
      }));
      console.log('✅ 补充购物车菜单');
    }

    // 2. 用户
    if ((await this.userRepo.count()) <= 1) {
      const salt = await bcrypt.genSalt(10);
      const hashPwd = async (p: string) => bcrypt.hash(p, salt);
      const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '刘一', '陈二',
        '林小明', '黄小红', '杨光', '马超', '韩梅梅', '李雷', '马云飞', '刘德华', '张学友', '郭富城',
        '王菲菲', '范冰冰', '赵丽颖', '杨幂幂', '唐嫣嫣', '周杰伦', '吴彦祖', '陈奕迅', '林志颖', '黄晓明'];
      const py = ['zhangsan','lisi','wangwu','zhaoliu','sunqi','zhouba','wujiu','zhengshi','liuyi','ener','linxm','huangxh','yangguang','machao','hanmm','lilei','mayunfei','ldh','zxy','gfc','wangff','fanbb','zhaoly','yangmi','tangyy','zhoujl','wyzu','chenyxn','linzy','huangxm'];
      const genders = ['male', 'female', 'unknown'] as const;
      const levels = ['normal', 'silver', 'gold', 'diamond'];
      const statuses = ['active', 'active', 'active', 'active', 'disabled'];
      const users: Partial<User>[] = [
        { username: 'admin', password: await hashPwd('admin123'), phone: '13800000000', email: 'admin@example.com', gender: 'male', status: 'active', level: 'diamond', roleId: allRoles[0]?.id, growthValue: 9999 },
        { username: 'operator', password: await hashPwd('123456'), phone: '13800000001', email: 'op@example.com', gender: 'female', status: 'active', level: 'gold', roleId: allRoles[1]?.id, growthValue: 5000 },
      ];
      for (let i = 0; i < names.length; i++) {
        users.push({
          username: py[i] || `user${i}`,
          password: await hashPwd('123456'),
          phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          email: `${py[i]}@example.com`,
          gender: genders[i % 3],
          status: statuses[i % 5],
          level: levels[i % 4],
          roleId: allRoles[Math.min(4, allRoles.length - 1)]?.id,
          growthValue: Math.floor(Math.random() * 3000),
          lastLoginAt: randomDate(30),
          lastLoginIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          lastLoginDevice: randomItem(['Chrome/Windows', 'Safari/macOS', 'Chrome/Android', 'Safari/iOS', 'Firefox/Linux']),
        });
      }
      await this.userRepo.save(this.userRepo.create(users));
      console.log(`✅ 用户: ${users.length}条`);
    }
    const allUsers = await this.userRepo.find();

    // 3. 会员等级
    if ((await this.levelRepo.count()) === 0) {
      await this.levelRepo.save(this.levelRepo.create([
        { name: '普通会员', icon: 'Star', growthThreshold: 0, discountRate: 1.0, benefits: '基础购物功能', order: 1, enabled: true },
        { name: '白银会员', icon: 'Trophy', growthThreshold: 500, discountRate: 0.95, benefits: '95折优惠, 优先客服', order: 2, enabled: true },
        { name: '黄金会员', icon: 'TrophyBase', growthThreshold: 2000, discountRate: 0.9, benefits: '9折优惠, 免运费, 专属活动', order: 3, enabled: true },
        { name: '钻石会员', icon: 'Diamond', growthThreshold: 5000, discountRate: 0.85, benefits: '85折, 免运费, VIP客服, 生日礼遇', order: 4, enabled: true },
        { name: '皇冠会员', icon: 'Crown', growthThreshold: 10000, discountRate: 0.8, benefits: '8折, 专属顾问, 新品优先, 年度礼包', order: 5, enabled: true },
      ]));
      console.log('✅ 会员等级: 5条');
    }

    // 4. 黑名单
    if ((await this.blRepo.count()) === 0) {
      await this.blRepo.save(this.blRepo.create([
        { userId: allUsers[5]?.id, username: allUsers[5]?.username, phone: allUsers[5]?.phone, reason: '恶意退款', isActive: true },
        { userId: allUsers[10]?.id, username: allUsers[10]?.username, phone: allUsers[10]?.phone, reason: '违规刷单', isActive: true },
        { userId: allUsers[15]?.id, username: allUsers[15]?.username, phone: allUsers[15]?.phone, reason: '辱骂客服', isActive: false },
      ]));
      console.log('✅ 黑名单: 3条');
    }

    // 5. 登录日志
    if ((await this.logRepo.count()) === 0) {
      const logs: Partial<LoginLog>[] = [];
      for (let i = 0; i < 30; i++) {
        const u = allUsers[i % allUsers.length];
        logs.push({ userId: u?.id, username: u?.username, ip: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, device: randomItem(['Chrome/Windows','Safari/macOS','Chrome/Android','Safari/iOS']), result: Math.random() > 0.1 ? 'success' : 'failed', createdAt: randomDate(30) });
      }
      await this.logRepo.save(this.logRepo.create(logs));
      console.log('✅ 登录日志: 30条');
    }

    // 6. 商品分类
    if ((await this.catRepo.count()) === 0) {
      await this.catRepo.save(this.catRepo.create([
        { name: '手机数码', icon: 'Iphone', description: '手机、平板、数码配件', order: 1, enabled: true },
        { name: '电脑办公', icon: 'Monitor', description: '笔记本、台式机、办公耗材', order: 2, enabled: true },
        { name: '家用电器', icon: 'Cpu', description: '空调、冰箱、洗衣机等', order: 3, enabled: true },
        { name: '服装鞋包', icon: 'Goods', description: '男装、女装、鞋靴、箱包', order: 4, enabled: true },
        { name: '食品生鲜', icon: 'Food', description: '零食、生鲜、饮品', order: 5, enabled: true },
        { name: '图书文具', icon: 'Notebook', description: '图书、文具、乐器', order: 6, enabled: true },
      ]));
      console.log('✅ 商品分类: 6条');
    }
    const allCats = await this.catRepo.find();

    // 7. 商品品牌
    if ((await this.brandRepo.count()) === 0) {
      await this.brandRepo.save(this.brandRepo.create([
        { name: 'Apple', logo: '🍎', description: '苹果产品', order: 1, enabled: true },
        { name: '华为', logo: '📱', description: '华为终端', order: 2, enabled: true },
        { name: '小米', logo: '🔶', description: '小米生态链', order: 3, enabled: true },
        { name: '三星', logo: '💎', description: '三星电子', order: 4, enabled: true },
        { name: '联想', logo: '💻', description: '联想集团', order: 5, enabled: true },
        { name: '海尔', logo: '🏠', description: '海尔智家', order: 6, enabled: true },
      ]));
      console.log('✅ 品牌: 6条');
    }
    const allBrands = await this.brandRepo.find();

    // 8. 商品
    if ((await this.prodRepo.count()) === 0) {
      const products = [
        { name: 'iPhone 15 Pro Max', subtitle: '钛金属设计, A17 Pro芯片', price: 9999, stock: 120, sales: 3500, categoryId: allCats[0]?.id, brandId: allBrands[0]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=iPhone15'] },
        { name: 'MacBook Pro 14', subtitle: 'M3 Pro芯片, Liquid Retina XDR', price: 14999, stock: 80, sales: 1200, categoryId: allCats[1]?.id, brandId: allBrands[0]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=MBP14'] },
        { name: '华为 Mate 60 Pro', subtitle: '麒麟9000S, 卫星通话', price: 6999, stock: 200, sales: 5000, categoryId: allCats[0]?.id, brandId: allBrands[1]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=Mate60'] },
        { name: '小米14 Ultra', subtitle: '骁龙8 Gen3, 徕卡影像', price: 5999, stock: 150, sales: 2800, categoryId: allCats[0]?.id, brandId: allBrands[2]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=Mi14'] },
        { name: 'AirPods Pro 2', subtitle: '自适应音频, USB-C充电', price: 1899, stock: 300, sales: 8000, categoryId: allCats[0]?.id, brandId: allBrands[0]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=AirPods'] },
        { name: 'iPad Air 5', subtitle: 'M1芯片, 10.9英寸', price: 4399, stock: 90, sales: 1500, categoryId: allCats[1]?.id, brandId: allBrands[0]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=iPadAir'] },
        { name: '海尔冰箱 BCD-500', subtitle: '500L对开门, 风冷无霜', price: 3299, stock: 60, sales: 800, categoryId: allCats[2]?.id, brandId: allBrands[5]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=HaierFridge'] },
        { name: 'ThinkPad X1 Carbon', subtitle: '14英寸轻薄商务本', price: 9999, stock: 45, sales: 600, categoryId: allCats[1]?.id, brandId: allBrands[4]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=ThinkPad'] },
        { name: '三星 Galaxy S24 Ultra', subtitle: '骁龙8 Gen3, S Pen', price: 8999, stock: 0, sales: 2000, categoryId: allCats[0]?.id, brandId: allBrands[3]?.id, isOnSale: false, images: ['https://via.placeholder.com/400x400?text=GalaxyS24'] },
        { name: '小米手环 8', subtitle: '1.62英寸AMOLED, 150+运动模式', price: 249, stock: 500, sales: 15000, categoryId: allCats[0]?.id, brandId: allBrands[2]?.id, isOnSale: true, images: ['https://via.placeholder.com/400x400?text=MiBand8'] },
      ];
      await this.prodRepo.save(this.prodRepo.create(products.map(p => ({ ...p, description: `${p.name} 详细介绍内容...`, specs: JSON.stringify([{name:'颜色',values:['黑色','白色','蓝色']},{name:'存储',values:['128GB','256GB','512GB']}]) }))));
      console.log('✅ 商品: 10条');
    }
    const allProds = await this.prodRepo.find();

    // 9. 商品规格
    if ((await this.specRepo.count()) === 0) {
      await this.specRepo.save(this.specRepo.create([
        { name: '颜色', values: '黑色,白色,蓝色,金色', enabled: true },
        { name: '存储容量', values: '64GB,128GB,256GB,512GB,1TB', enabled: true },
        { name: '内存', values: '4GB,8GB,16GB,32GB', enabled: true },
        { name: '尺寸', values: 'S,M,L,XL,XXL', enabled: true },
      ]));
      console.log('✅ 规格: 4条');
    }

    // 10. 订单
    if ((await this.orderRepo.count()) === 0) {
      const statuses = ['待付款', '已付款', '已发货', '已完成', '已完成', '已完成', '已取消', '退款中'];
      const companies = ['顺丰速运', '中通快递', '圆通速递', '韵达快递'];
      const orders: Partial<Order>[] = [];
      for (let i = 0; i < 40; i++) {
        const u = allUsers[i % allUsers.length];
        const p = allProds[i % allProds.length];
        const st = statuses[i % statuses.length];
        const qty = Math.floor(Math.random() * 3) + 1;
        orders.push({
          orderNo: `ORD${String(20240001 + i)}`,
          userId: u?.id, userName: u?.username || '未知',
          productId: p?.id, productName: p?.name || '商品',
          amount: (p?.price || 100) * qty, status: st, quantity: qty,
          address: `北京市朝阳区某某路${i + 1}号`, phone: u?.phone,
          paymentMethod: randomItem(['在线支付', '货到付款', '余额支付']),
          receiverName: u?.username, receiverPhone: u?.phone,
          logisticsCompany: st === '已发货' || st === '已完成' ? randomItem(companies) : null,
          logisticsNo: st === '已发货' || st === '已完成' ? `SF${Math.floor(Math.random() * 1000000000)}` : null,
          remark: i % 5 === 0 ? '请尽快发货' : null, createdAt: randomDate(60),
        });
      }
      await this.orderRepo.save(this.orderRepo.create(orders));
      console.log('✅ 订单: 40条');
    }

    // 11. 售后
    if ((await this.asRepo.count()) === 0) {
      const asTypes = ['退货退款', '换货', '仅退款', '维修'];
      const asStatuses = ['待审核', '处理中', '已完成', '已拒绝'];
      const asList: Partial<AfterSale>[] = [];
      for (let i = 0; i < 8; i++) {
        const u = allUsers[i % allUsers.length];
        asList.push({
          orderId: i + 1, orderNo: `ORD${20240001 + i}`,
          userId: u?.id, userName: u?.username || '未知',
          type: asTypes[i % 4], reason: `商品${randomItem(['有瑕疵','与描述不符','尺寸不对','质量问题'])}`,
          status: asStatuses[i % 4], refundAmount: Math.floor(Math.random() * 5000) + 500,
          description: '详细说明售后原因...', createdAt: randomDate(30),
        });
      }
      await this.asRepo.save(this.asRepo.create(asList));
      console.log('✅ 售后: 8条');
    }

    // 12. 快递公司
    if ((await this.scRepo.count()) === 0) {
      await this.scRepo.save(this.scRepo.create([
        { name: '顺丰速运', logo: '🟤', website: 'https://www.sf-express.com', order: 1, enabled: true },
        { name: '中通快递', logo: '🔵', website: 'https://www.zto.com', order: 2, enabled: true },
        { name: '圆通速递', logo: '🟢', website: 'https://www.yto.net.cn', order: 3, enabled: true },
        { name: '韵达快递', logo: '🟡', website: 'https://www.yundaex.com', order: 4, enabled: true },
        { name: '京东物流', logo: '🔴', website: 'https://www.jdl.com', order: 5, enabled: true },
        { name: '邮政EMS', logo: '⚪', website: 'https://www.ems.com.cn', order: 6, enabled: true },
      ]));
      console.log('✅ 快递公司: 6条');
    }

    // 13. 运费模板
    if ((await this.stRepo.count()) === 0) {
      await this.stRepo.save(this.stRepo.create([
        { name: '默认运费模板', chargeType: 'byPiece', defaultFee: 10, enabled: true },
        { name: '大件商品模板', chargeType: 'byWeight', defaultFee: 30, enabled: true },
        { name: '包邮模板', chargeType: 'byPiece', defaultFee: 0, enabled: true },
      ]));
      console.log('✅ 运费模板: 3条');
    }

    // 13.5 购物车
    if ((await this.cartRepo.count()) === 0) {
      const cartItems: Partial<CartItem>[] = [];
      // 给前5个用户各加几个购物车商品
      for (let i = 0; i < 5; i++) {
        const u = allUsers[i];
        const numItems = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numItems; j++) {
          const p = allProds[(i * 3 + j) % allProds.length];
          if (p && p.isOnSale) {
            cartItems.push({
              userId: u?.id,
              productId: p.id,
              productName: p.name,
              price: p.price,
              quantity: Math.floor(Math.random() * 2) + 1,
              spec: randomItem(['黑色/256GB', '白色/128GB', '蓝色/512GB', '金色/1TB']),
              image: p.images?.[0] || null,
              checked: Math.random() > 0.3,
            });
          }
        }
      }
      if (cartItems.length > 0) {
        await this.cartRepo.save(this.cartRepo.create(cartItems));
        console.log(`✅ 购物车: ${cartItems.length}条`);
      }
    }

    // 14. 内容分类
    if ((await this.ccRepo.count()) === 0) {
      await this.ccRepo.save(this.ccRepo.create([
        { name: '公司动态', icon: 'OfficeBuilding', description: '公司新闻和动态', order: 1, enabled: true },
        { name: '行业资讯', icon: 'TrendCharts', description: '行业趋势和分析', order: 2, enabled: true },
        { name: '产品教程', icon: 'Reading', description: '产品使用指南', order: 3, enabled: true },
        { name: '帮助中心', icon: 'QuestionFilled', description: '常见问题解答', order: 4, enabled: true },
      ]));
      console.log('✅ 内容分类: 4条');
    }
    const allContentCats = await this.ccRepo.find();

    // 15. 文章
    if ((await this.artRepo.count()) === 0) {
      const articles = [
        { title: '2024年度公司发展规划发布', content: '<p>公司将在2024年重点发展...</p>', summary: '公司发布新年度发展规划', status: 'published', categoryId: allContentCats[0]?.id, author: '管理员', viewCount: 1250, isTop: true },
        { title: '电商行业趋势分析报告', content: '<p>2024年电商行业呈现以下趋势...</p>', summary: '最新电商行业趋势分析', status: 'published', categoryId: allContentCats[1]?.id, author: '运营', viewCount: 890 },
        { title: '新品发布：iPhone 15系列全面解析', content: '<p>苹果最新发布的iPhone 15系列...</p>', summary: 'iPhone 15系列详细评测', status: 'published', categoryId: allContentCats[1]?.id, author: '编辑', viewCount: 3200 },
        { title: '如何使用会员积分兑换礼品', content: '<p>会员积分兑换流程如下...</p>', summary: '积分兑换使用指南', status: 'published', categoryId: allContentCats[2]?.id, author: '客服', viewCount: 560 },
        { title: '退换货政策说明', content: '<p>关于退换货政策的详细说明...</p>', summary: '退换货政策完整说明', status: 'published', categoryId: allContentCats[3]?.id, author: '客服', viewCount: 2100 },
        { title: '系统维护公告（草稿）', content: '<p>系统将于本周六凌晨2点进行维护...</p>', summary: '系统维护通知', status: 'draft', categoryId: allContentCats[0]?.id, author: '管理员', viewCount: 0 },
      ];
      await this.artRepo.save(this.artRepo.create(articles.map(a => ({ ...a, publishAt: a.status === 'published' ? randomDate(30) : null }))));
      console.log('✅ 文章: 6条');
    }

    // 16. 广告位
    if ((await this.apRepo.count()) === 0) {
      await this.apRepo.save(this.apRepo.create([
        { name: '首页轮播图', code: 'home_banner', width: 1920, height: 600, enabled: true },
        { name: '首页侧栏', code: 'home_sidebar', width: 300, height: 250, enabled: true },
        { name: '商品详情页', code: 'product_detail', width: 750, height: 200, enabled: true },
      ]));
      console.log('✅ 广告位: 3条');
    }
    const allPositions = await this.apRepo.find();

    // 17. 广告
    if ((await this.adRepo.count()) === 0) {
      await this.adRepo.save(this.adRepo.create([
        { title: '618大促', imageUrl: 'https://via.placeholder.com/1920x600?text=618', linkUrl: '/products', positionId: allPositions[0]?.id, position: '首页', enabled: true, startTime: new Date(), endTime: new Date(Date.now() + 30 * 86400000) },
        { title: '新品首发', imageUrl: 'https://via.placeholder.com/1920x600?text=NewArrival', linkUrl: '/products', positionId: allPositions[0]?.id, position: '首页', enabled: true, startTime: new Date(), endTime: new Date(Date.now() + 15 * 86400000) },
        { title: '会员日特惠', imageUrl: 'https://via.placeholder.com/300x250?text=VIP', linkUrl: '/users/levels', positionId: allPositions[1]?.id, position: '侧栏', enabled: true, startTime: new Date(), endTime: new Date(Date.now() + 7 * 86400000) },
      ]));
      console.log('✅ 广告: 3条');
    }

    // 18. 公告
    if ((await this.annRepo.count()) === 0) {
      await this.annRepo.save(this.annRepo.create([
        { title: '系统升级公告', content: '系统将于本周六凌晨2:00-6:00进行升级维护', type: 'system', scope: 'all', isTop: true, status: 'published', enabled: true, publishAt: new Date(), expireAt: new Date(Date.now() + 7 * 86400000) },
        { title: '618活动规则说明', content: '618年中大促活动规则：满300减50...', type: 'activity', scope: 'all', isTop: false, status: 'published', enabled: true, publishAt: new Date(), expireAt: new Date(Date.now() + 30 * 86400000) },
        { title: '春节放假通知', content: '春节期间放假安排如下...', type: 'maintenance', scope: 'all', isTop: false, status: 'published', enabled: true, publishAt: new Date(), expireAt: new Date(Date.now() + 60 * 86400000) },
      ]));
      console.log('✅ 公告: 3条');
    }

    // 19. 消息
    if ((await this.msgRepo.count()) === 0) {
      await this.msgRepo.save(this.msgRepo.create([
        { title: '欢迎注册', content: '欢迎注册通用管理系统！', senderName: '系统', type: 'system', category: 'system', isRead: false, createdAt: randomDate(7) },
        { title: '订单发货通知', content: '您的订单 ORD20240001 已发货', senderName: '系统', type: 'system', category: 'order', isRead: false, createdAt: randomDate(3) },
        { title: '会员升级成功', content: '恭喜您升级为黄金会员！', senderName: '系统', type: 'system', category: 'system', isRead: true, createdAt: randomDate(14) },
        { title: '618活动开启', content: '618年中大促正式开始，全场满300减50', senderName: '运营', type: 'system', category: 'activity', isRead: false, createdAt: randomDate(1) },
        { title: '密码修改提醒', content: '您的密码已修改成功', senderName: '系统', type: 'system', category: 'system', isRead: true, createdAt: randomDate(5) },
        { title: '退款处理通知', content: '您的退款申请已审核通过', senderName: '客服', type: 'system', category: 'order', isRead: false, createdAt: randomDate(2) },
      ]));
      console.log('✅ 消息: 6条');
    }

    // 20. 消息模板
    if ((await this.mtRepo.count()) === 0) {
      await this.mtRepo.save(this.mtRepo.create([
        { name: '订单发货通知', code: 'order_shipped', type: 'inbox', triggerEvent: '订单发货', subject: '订单发货通知', content: '您的订单 {{orderNo}} 已发货，快递单号：{{trackingNo}}', enabled: true },
        { name: '注册欢迎', code: 'welcome', type: 'inbox', triggerEvent: '注册欢迎', subject: '欢迎注册', content: '欢迎 {{username}} 注册我们的平台！', enabled: true },
        { name: '密码重置', code: 'password_reset', type: 'email', triggerEvent: '密码重置', subject: '密码重置验证码', content: '您的密码重置验证码为：{{code}}，有效期5分钟', enabled: true },
        { name: '促销活动', code: 'promotion', type: 'sms', triggerEvent: '促销活动', subject: null, content: '{{activityName}} 活动已开始，{{description}}', enabled: true },
      ]));
      console.log('✅ 消息模板: 4条');
    }

    // 21. 推送记录
    if ((await this.prRepo.count()) === 0) {
      await this.prRepo.save(this.prRepo.create([
        { title: '618活动推送', channel: 'sms', sentCount: 1000, readCount: 800, successCount: 980, failCount: 20, status: 'success', content: '618大促开始啦！', createdAt: randomDate(10) },
        { title: '系统升级通知', channel: 'email', sentCount: 500, readCount: 450, successCount: 495, failCount: 5, status: 'success', content: '系统将于周六升级', createdAt: randomDate(5) },
        { title: '会员日提醒', channel: 'sms', sentCount: 200, readCount: 120, successCount: 150, failCount: 50, status: 'partial', content: '会员日专属优惠已到账', createdAt: randomDate(2) },
      ]));
      console.log('✅ 推送记录: 3条');
    }

    // 22. 系统设置
    if ((await this.ssRepo.count()) === 0) {
      await this.ssRepo.save(this.ssRepo.create([
        { key: 'site_name', value: '通用管理系统', group: 'basic' },
        { key: 'site_description', value: '一站式企业级管理平台', group: 'basic' },
        { key: 'contact_email', value: 'admin@example.com', group: 'basic' },
        { key: 'contact_phone', value: '400-888-8888', group: 'basic' },
        { key: 'page_size', value: '10', group: 'basic' },
        { key: 'maintenance_mode', value: 'false', group: 'basic' },
        { key: 'min_password_length', value: '8', group: 'security' },
        { key: 'login_lock_enabled', value: 'true', group: 'security' },
        { key: 'max_login_attempts', value: '5', group: 'security' },
        { key: 'session_timeout', value: '24', group: 'security' },
        { key: 'email_enabled', value: 'true', group: 'notification' },
        { key: 'sms_enabled', value: 'false', group: 'notification' },
      ]));
      console.log('✅ 系统设置: 12条');
    }

    // 23. 系统日志
    if ((await this.slRepo.count()) === 0) {
      const sysLogs: Partial<SystemLog>[] = [];
      const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
      const sources = ['AuthService', 'OrderService', 'UserService', 'System', 'PaymentService'];
      const actions = ['用户登录', '创建订单', '数据备份', '内存告警', '支付超时', '缓存清理', '连接池满', '文件上传'];
      const modules = ['auth', 'order', 'system', 'system', 'payment'];
      for (let i = 0; i < 25; i++) {
        const u = allUsers[i % allUsers.length];
        sysLogs.push({ userId: u?.id || 1, username: u?.username || 'admin', action: actions[i % 8], module: modules[i % 5], level: levels[i % 5], result: levels[i % 5] === 'ERROR' ? 'failed' : 'success', source: sources[i % 5], device: randomItem(['Server', 'Worker-1', 'Worker-2']), ip: `10.0.0.${Math.floor(Math.random()*255)}`, detail: `${actions[i % 8]}操作详情...`, createdAt: randomDate(30) });
      }
      await this.slRepo.save(this.slRepo.create(sysLogs));
      console.log('✅ 系统日志: 25条');
    }

    console.log('🌱 种子数据检查完成');
  }
}
