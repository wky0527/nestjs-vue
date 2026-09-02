/**
 * 数据库假数据种子脚本
 * 运行: npx ts-node src/seed.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// 导入所有实体
import { User } from './modules/user/user.entity';
import { MemberLevel } from './modules/user/member-level.entity';
import { Blacklist } from './modules/user/blacklist.entity';
import { LoginLog } from './modules/user/login-log.entity';
import { Role } from './modules/auth/role.entity';
import { Permission } from './modules/auth/permission.entity';
import { RolePermission } from './modules/auth/role-permission.entity';
import { Menu } from './modules/auth/menu.entity';
import { Button } from './modules/auth/button.entity';
import { Order } from './modules/order/order.entity';
import { AfterSale } from './modules/order/after-sale.entity';
import { ShippingCompany } from './modules/order/shipping-company.entity';
import { ShippingTemplate } from './modules/order/shipping-template.entity';
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

const ds = new DataSource({
  type: 'sqljs',
  location: 'dev.sqlite',
  autoSave: true,
  synchronize: true,
  entities: [
    User, MemberLevel, Blacklist, LoginLog,
    Role, Permission, RolePermission, Menu, Button,
    Order, AfterSale, ShippingCompany, ShippingTemplate,
    Product, ProductCategory, ProductBrand, ProductSpec,
    Article, ContentCategory, Ad, AdPosition, Announcement,
    Message, MessageTemplate, PushRecord,
    SystemSetting, SystemLog,
  ],
});

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d;
}

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function seed() {
  await ds.initialize();
  console.log('✅ 数据库连接成功，开始插入数据...');

  // ========== 1. 角色 ==========
  const roleRepo = ds.getRepository(Role);
  const existingRoles = await roleRepo.count();
  if (existingRoles > 0) { console.log('⏭ 角色数据已存在，跳过'); } else {
    const roles = roleRepo.create([
      { name: 'admin', code: 'admin', description: '超级管理员，拥有系统全部权限', isDefault: false, enabled: true },
      { name: 'operator', code: 'operator', description: '运营管理员，负责日常运营管理', isDefault: false, enabled: true },
      { name: 'editor', code: 'editor', description: '内容编辑，负责内容发布和编辑', isDefault: false, enabled: true },
      { name: 'support', code: 'support', description: '客服，处理用户咨询和售后', isDefault: false, enabled: true },
      { name: 'user', code: 'user', description: '普通用户，注册用户默认角色', isDefault: true, enabled: true },
    ]);
    await roleRepo.save(roles);
    console.log(`✅ 角色: ${roles.length}条`);
  }
  const allRoles = await roleRepo.find();

  // ========== 2. 用户 ==========
  const userRepo = ds.getRepository(User);
  const existingUsers = await userRepo.count();
  if (existingUsers > 1) { console.log('⏭ 用户数据已存在，跳过'); } else {
    const salt = await bcrypt.genSalt(10);
    const hashPwd = async (p: string) => bcrypt.hash(p, salt);
    const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '刘一', '陈二',
      '林小明', '黄小红', '杨光', '马超', '韩梅梅', '李雷', '马云飞', '刘德华', '张学友', '郭富城',
      '王菲菲', '范冰冰', '赵丽颖', '杨幂幂', '唐嫣嫣', '周杰伦', '吴彦祖', '陈奕迅', '林志颖', '黄晓明'];
    const genders = ['male', 'female', 'unknown'] as const;
    const levels = ['normal', 'silver', 'gold', 'diamond'];
    const statuses = ['active', 'active', 'active', 'active', 'disabled'];
    const users: Partial<User>[] = [
      { username: 'admin', password: await hashPwd('admin123'), phone: '13800000000', email: 'admin@example.com', gender: 'male', status: 'active', level: 'diamond', roleId: allRoles[0]?.id, growthValue: 9999 },
      { username: 'operator', password: await hashPwd('123456'), phone: '13800000001', email: 'op@example.com', gender: 'female', status: 'active', level: 'gold', roleId: allRoles[1]?.id, growthValue: 5000 },
    ];
    for (let i = 0; i < names.length; i++) {
      const py = ['zhangsan','lisi','wangwu','zhaoliu','sunqi','zhouba','wujiu','zhengshi','liuyi','ener','linxm','huangxh','yangguang','machao','hanmm','lilei','mayunfei','ldh','zxy','gfc','wangff','fanbb','zhaoly','yangmi','tangyy','zhoujl','wyzu','chenyxn','linzy','huangxm'];
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
    const created = userRepo.create(users);
    await userRepo.save(created);
    console.log(`✅ 用户: ${created.length}条`);
  }
  const allUsers = await userRepo.find();

  // ========== 3. 会员等级 ==========
  const levelRepo = ds.getRepository(MemberLevel);
  if ((await levelRepo.count()) > 0) { console.log('⏭ 会员等级已存在，跳过'); } else {
    const levels = levelRepo.create([
      { name: '普通会员', icon: 'Star', growthThreshold: 0, discountRate: 1.0, benefits: '基础购物功能', order: 1, enabled: true },
      { name: '白银会员', icon: 'Trophy', growthThreshold: 500, discountRate: 0.95, benefits: '95折优惠, 优先客服', order: 2, enabled: true },
      { name: '黄金会员', icon: 'TrophyBase', growthThreshold: 2000, discountRate: 0.9, benefits: '9折优惠, 免运费, 专属活动', order: 3, enabled: true },
      { name: '钻石会员', icon: 'Diamond', growthThreshold: 5000, discountRate: 0.85, benefits: '85折, 免运费, VIP客服, 生日礼遇', order: 4, enabled: true },
      { name: '皇冠会员', icon: 'Crown', growthThreshold: 10000, discountRate: 0.8, benefits: '8折, 专属顾问, 新品优先, 年度礼包', order: 5, enabled: true },
    ]);
    await levelRepo.save(levels);
    console.log(`✅ 会员等级: ${levels.length}条`);
  }

  // ========== 4. 黑名单 ==========
  const blRepo = ds.getRepository(Blacklist);
  if ((await blRepo.count()) > 0) { console.log('⏭ 黑名单已存在，跳过'); } else {
    const bls = blRepo.create([
      { userId: allUsers[5]?.id, username: allUsers[5]?.username, phone: allUsers[5]?.phone, reason: '恶意退款', isActive: true },
      { userId: allUsers[10]?.id, username: allUsers[10]?.username, phone: allUsers[10]?.phone, reason: '违规刷单', isActive: true },
      { userId: allUsers[15]?.id, username: allUsers[15]?.username, phone: allUsers[15]?.phone, reason: '辱骂客服', isActive: false },
    ]);
    await blRepo.save(bls);
    console.log(`✅ 黑名单: ${bls.length}条`);
  }

  // ========== 5. 登录日志 ==========
  const logRepo = ds.getRepository(LoginLog);
  if ((await logRepo.count()) > 0) { console.log('⏭ 登录日志已存在，跳过'); } else {
    const logs: Partial<LoginLog>[] = [];
    for (let i = 0; i < 30; i++) {
      const u = allUsers[i % allUsers.length];
      logs.push({ userId: u?.id, username: u?.username, ip: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, device: randomItem(['Chrome/Windows','Safari/macOS','Chrome/Android','Safari/iOS']), result: Math.random() > 0.1 ? 'success' : 'failed', createdAt: randomDate(30) });
    }
    await logRepo.save(logRepo.create(logs));
    console.log(`✅ 登录日志: 30条`);
  }

  // ========== 6. 商品分类 ==========
  const catRepo = ds.getRepository(ProductCategory);
  if ((await catRepo.count()) > 0) { console.log('⏭ 商品分类已存在，跳过'); } else {
    const cats = catRepo.create([
      { name: '手机数码', icon: 'Iphone', description: '手机、平板、数码配件', order: 1, enabled: true },
      { name: '电脑办公', icon: 'Monitor', description: '笔记本、台式机、办公耗材', order: 2, enabled: true },
      { name: '家用电器', icon: 'Cpu', description: '空调、冰箱、洗衣机等', order: 3, enabled: true },
      { name: '服装鞋包', icon: 'Goods', description: '男装、女装、鞋靴、箱包', order: 4, enabled: true },
      { name: '食品生鲜', icon: 'Food', description: '零食、生鲜、饮品', order: 5, enabled: true },
      { name: '图书文具', icon: 'Notebook', description: '图书、文具、乐器', order: 6, enabled: true },
    ]);
    await catRepo.save(cats);
    console.log(`✅ 商品分类: ${cats.length}条`);
  }
  const allCats = await catRepo.find();

  // ========== 7. 商品品牌 ==========
  const brandRepo = ds.getRepository(ProductBrand);
  if ((await brandRepo.count()) > 0) { console.log('⏭ 品牌已存在，跳过'); } else {
    const brands = brandRepo.create([
      { name: 'Apple', logo: '🍎', description: '苹果产品', order: 1, enabled: true },
      { name: '华为', logo: '📱', description: '华为终端', order: 2, enabled: true },
      { name: '小米', logo: '🔶', description: '小米生态链', order: 3, enabled: true },
      { name: '三星', logo: '💎', description: '三星电子', order: 4, enabled: true },
      { name: '联想', logo: '💻', description: '联想集团', order: 5, enabled: true },
      { name: '海尔', logo: '🏠', description: '海尔智家', order: 6, enabled: true },
    ]);
    await brandRepo.save(brands);
    console.log(`✅ 品牌: ${brands.length}条`);
  }
  const allBrands = await brandRepo.find();

  // ========== 8. 商品 ==========
  const prodRepo = ds.getRepository(Product);
  if ((await prodRepo.count()) > 0) { console.log('⏭ 商品已存在，跳过'); } else {
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
    const prods = prodRepo.create(products.map(p => ({ ...p, description: `${p.name} 详细介绍内容...`, specs: JSON.stringify([{name:'颜色',values:['黑色','白色','蓝色']},{name:'存储',values:['128GB','256GB','512GB']}]) })));
    await prodRepo.save(prods);
    console.log(`✅ 商品: ${prods.length}条`);
  }
  const allProds = await prodRepo.find();

  // ========== 9. 商品规格 ==========
  const specRepo = ds.getRepository(ProductSpec);
  if ((await specRepo.count()) > 0) { console.log('⏭ 规格已存在，跳过'); } else {
    const specs = specRepo.create([
      { name: '颜色', values: '黑色,白色,蓝色,金色', enabled: true },
      { name: '存储容量', values: '64GB,128GB,256GB,512GB,1TB', enabled: true },
      { name: '内存', values: '4GB,8GB,16GB,32GB', enabled: true },
      { name: '尺寸', values: 'S,M,L,XL,XXL', enabled: true },
    ]);
    await specRepo.save(specs);
    console.log(`✅ 规格: ${specs.length}条`);
  }

  // ========== 10. 订单 ==========
  const orderRepo = ds.getRepository(Order);
  if ((await orderRepo.count()) > 0) { console.log('⏭ 订单已存在，跳过'); } else {
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
        amount: (p?.price || 100) * qty,
        status: st, quantity: qty,
        address: `北京市朝阳区某某路${i + 1}号`,
        phone: u?.phone, paymentMethod: randomItem(['在线支付', '货到付款', '余额支付']),
        receiverName: u?.username, receiverPhone: u?.phone,
        logisticsCompany: st === '已发货' || st === '已完成' ? randomItem(companies) : null,
        logisticsNo: st === '已发货' || st === '已完成' ? `SF${Math.floor(Math.random() * 1000000000)}` : null,
        remark: i % 5 === 0 ? '请尽快发货' : null,
        createdAt: randomDate(60),
      });
    }
    await orderRepo.save(orderRepo.create(orders));
    console.log(`✅ 订单: 40条`);
  }

  // ========== 11. 售后 ==========
  const asRepo = ds.getRepository(AfterSale);
  if ((await asRepo.count()) > 0) { console.log('⏭ 售后已存在，跳过'); } else {
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
    await asRepo.save(asRepo.create(asList));
    console.log(`✅ 售后: ${asList.length}条`);
  }

  // ========== 12. 快递公司 ==========
  const scRepo = ds.getRepository(ShippingCompany);
  if ((await scRepo.count()) > 0) { console.log('⏭ 快递公司已存在，跳过'); } else {
    const companies = scRepo.create([
      { name: '顺丰速运', logo: '🟤', website: 'https://www.sf-express.com', order: 1, enabled: true },
      { name: '中通快递', logo: '🔵', website: 'https://www.zto.com', order: 2, enabled: true },
      { name: '圆通速递', logo: '🟢', website: 'https://www.yto.net.cn', order: 3, enabled: true },
      { name: '韵达快递', logo: '🟡', website: 'https://www.yundaex.com', order: 4, enabled: true },
      { name: '京东物流', logo: '🔴', website: 'https://www.jdl.com', order: 5, enabled: true },
      { name: '邮政EMS', logo: '⚪', website: 'https://www.ems.com.cn', order: 6, enabled: true },
    ]);
    await scRepo.save(companies);
    console.log(`✅ 快递公司: ${companies.length}条`);
  }

  // ========== 13. 运费模板 ==========
  const stRepo = ds.getRepository(ShippingTemplate);
  if ((await stRepo.count()) > 0) { console.log('⏭ 运费模板已存在，跳过'); } else {
    const templates = stRepo.create([
      { name: '默认运费模板', chargeType: 'byPiece', defaultFee: 10, enabled: true },
      { name: '大件商品模板', chargeType: 'byWeight', defaultFee: 30, enabled: true },
      { name: '包邮模板', chargeType: 'byPiece', defaultFee: 0, enabled: true },
    ]);
    await stRepo.save(templates);
    console.log(`✅ 运费模板: ${templates.length}条`);
  }

  // ========== 14. 内容分类 ==========
  const ccRepo = ds.getRepository(ContentCategory);
  if ((await ccRepo.count()) > 0) { console.log('⏭ 内容分类已存在，跳过'); } else {
    const ccats = ccRepo.create([
      { name: '公司动态', icon: 'OfficeBuilding', description: '公司新闻和动态', order: 1, enabled: true },
      { name: '行业资讯', icon: 'TrendCharts', description: '行业趋势和分析', order: 2, enabled: true },
      { name: '产品教程', icon: 'Reading', description: '产品使用指南', order: 3, enabled: true },
      { name: '帮助中心', icon: 'QuestionFilled', description: '常见问题解答', order: 4, enabled: true },
    ]);
    await ccRepo.save(ccats);
    console.log(`✅ 内容分类: ${ccats.length}条`);
  }
  const allContentCats = await ccRepo.find();

  // ========== 15. 文章 ==========
  const artRepo = ds.getRepository(Article);
  if ((await artRepo.count()) > 0) { console.log('⏭ 文章已存在，跳过'); } else {
    const articles = [
      { title: '2024年度公司发展规划发布', content: '<p>公司将在2024年重点发展...</p>', summary: '公司发布新年度发展规划', status: 'published', categoryId: allContentCats[0]?.id, author: '管理员', viewCount: 1250, isTop: true },
      { title: '电商行业趋势分析报告', content: '<p>2024年电商行业呈现以下趋势...</p>', summary: '最新电商行业趋势分析', status: 'published', categoryId: allContentCats[1]?.id, author: '运营', viewCount: 890 },
      { title: '新品发布：iPhone 15系列全面解析', content: '<p>苹果最新发布的iPhone 15系列...</p>', summary: 'iPhone 15系列详细评测', status: 'published', categoryId: allContentCats[1]?.id, author: '编辑', viewCount: 3200 },
      { title: '如何使用会员积分兑换礼品', content: '<p>会员积分兑换流程如下...</p>', summary: '积分兑换使用指南', status: 'published', categoryId: allContentCats[2]?.id, author: '客服', viewCount: 560 },
      { title: '退换货政策说明', content: '<p>关于退换货政策的详细说明...</p>', summary: '退换货政策完整说明', status: 'published', categoryId: allContentCats[3]?.id, author: '客服', viewCount: 2100 },
      { title: '系统维护公告（草稿）', content: '<p>系统将于本周六凌晨2点进行维护...</p>', summary: '系统维护通知', status: 'draft', categoryId: allContentCats[0]?.id, author: '管理员', viewCount: 0 },
    ];
    const arts = artRepo.create(articles.map(a => ({ ...a, publishAt: a.status === 'published' ? randomDate(30) : null })));
    await artRepo.save(arts);
    console.log(`✅ 文章: ${arts.length}条`);
  }

  // ========== 16. 广告位 ==========
  const apRepo = ds.getRepository(AdPosition);
  if ((await apRepo.count()) > 0) { console.log('⏭ 广告位已存在，跳过'); } else {
    const positions = apRepo.create([
      { name: '首页轮播图', code: 'home_banner', width: 1920, height: 600, enabled: true },
      { name: '首页侧栏', code: 'home_sidebar', width: 300, height: 250, enabled: true },
      { name: '商品详情页', code: 'product_detail', width: 750, height: 200, enabled: true },
    ]);
    await apRepo.save(positions);
    console.log(`✅ 广告位: ${positions.length}条`);
  }
  const allPositions = await apRepo.find();

  // ========== 17. 广告 ==========
  const adRepo = ds.getRepository(Ad);
  if ((await adRepo.count()) > 0) { console.log('⏭ 广告已存在，跳过'); } else {
    const ads = adRepo.create([
      { title: '618大促', imageUrl: 'https://via.placeholder.com/1920x600?text=618', linkUrl: '/products', positionId: allPositions[0]?.id, position: '首页', enabled: true, startTime: new Date(), endTime: new Date(Date.now() + 30 * 86400000) },
      { title: '新品首发', imageUrl: 'https://via.placeholder.com/1920x600?text=NewArrival', linkUrl: '/products', positionId: allPositions[0]?.id, position: '首页', enabled: true, startTime: new Date(), endTime: new Date(Date.now() + 15 * 86400000) },
      { title: '会员日特惠', imageUrl: 'https://via.placeholder.com/300x250?text=VIP', linkUrl: '/users/levels', positionId: allPositions[1]?.id, position: '侧栏', enabled: true, startTime: new Date(), endTime: new Date(Date.now() + 7 * 86400000) },
    ]);
    await adRepo.save(ads);
    console.log(`✅ 广告: ${ads.length}条`);
  }

  // ========== 18. 公告 ==========
  const annRepo = ds.getRepository(Announcement);
  if ((await annRepo.count()) > 0) { console.log('⏭ 公告已存在，跳过'); } else {
    const anns = annRepo.create([
      { title: '系统升级公告', content: '系统将于本周六凌晨2:00-6:00进行升级维护', type: 'system', scope: 'all', isTop: true, enabled: true, publishAt: new Date(), expireAt: new Date(Date.now() + 7 * 86400000) },
      { title: '618活动规则说明', content: '618年中大促活动规则：满300减50...', type: 'activity', scope: 'all', isTop: false, enabled: true, publishAt: new Date(), expireAt: new Date(Date.now() + 30 * 86400000) },
      { title: '春节放假通知', content: '春节期间放假安排如下...', type: 'maintenance', scope: 'all', isTop: false, enabled: true, publishAt: new Date(), expireAt: new Date(Date.now() + 60 * 86400000) },
    ]);
    await annRepo.save(anns);
    console.log(`✅ 公告: ${anns.length}条`);
  }

  // ========== 19. 消息 ==========
  const msgRepo = ds.getRepository(Message);
  if ((await msgRepo.count()) > 0) { console.log('⏭ 消息已存在，跳过'); } else {
    const msgs: Partial<Message>[] = [
      { title: '欢迎注册', content: '欢迎注册通用管理系统！', senderName: '系统', type: 'system', category: 'system', isRead: false, createdAt: randomDate(7) },
      { title: '订单发货通知', content: '您的订单 ORD20240001 已发货', senderName: '系统', type: 'system', category: 'order', isRead: false, createdAt: randomDate(3) },
      { title: '会员升级成功', content: '恭喜您升级为黄金会员！', senderName: '系统', type: 'system', category: 'system', isRead: true, createdAt: randomDate(14) },
      { title: '618活动开启', content: '618年中大促正式开始，全场满300减50', senderName: '运营', type: 'system', category: 'activity', isRead: false, createdAt: randomDate(1) },
      { title: '密码修改提醒', content: '您的密码已修改成功', senderName: '系统', type: 'system', category: 'system', isRead: true, createdAt: randomDate(5) },
      { title: '退款处理通知', content: '您的退款申请已审核通过', senderName: '客服', type: 'system', category: 'order', isRead: false, createdAt: randomDate(2) },
    ];
    await msgRepo.save(msgRepo.create(msgs));
    console.log(`✅ 消息: ${msgs.length}条`);
  }

  // ========== 20. 消息模板 ==========
  const mtRepo = ds.getRepository(MessageTemplate);
  if ((await mtRepo.count()) > 0) { console.log('⏭ 消息模板已存在，跳过'); } else {
    const templates = mtRepo.create([
      { name: '订单发货通知', code: 'order_shipped', type: 'inbox', triggerEvent: '订单发货', subject: '订单发货通知', content: '您的订单 {{orderNo}} 已发货，快递单号：{{trackingNo}}', enabled: true },
      { name: '注册欢迎', code: 'welcome', type: 'inbox', triggerEvent: '注册欢迎', subject: '欢迎注册', content: '欢迎 {{username}} 注册我们的平台！', enabled: true },
      { name: '密码重置', code: 'password_reset', type: 'email', triggerEvent: '密码重置', subject: '密码重置验证码', content: '您的密码重置验证码为：{{code}}，有效期5分钟', enabled: true },
      { name: '促销活动', code: 'promotion', type: 'sms', triggerEvent: '促销活动', subject: null, content: '{{activityName}} 活动已开始，{{description}}', enabled: true },
    ]);
    await mtRepo.save(templates);
    console.log(`✅ 消息模板: ${templates.length}条`);
  }

  // ========== 21. 推送记录 ==========
  const prRepo = ds.getRepository(PushRecord);
  if ((await prRepo.count()) > 0) { console.log('⏭ 推送记录已存在，跳过'); } else {
    const records = prRepo.create([
      { title: '618活动推送', channel: 'sms', sentCount: 1000, readCount: 800, successCount: 980, failCount: 20, status: 'success', content: '618大促开始啦！', createdAt: randomDate(10) },
      { title: '系统升级通知', channel: 'email', sentCount: 500, readCount: 450, successCount: 495, failCount: 5, status: 'success', content: '系统将于周六升级', createdAt: randomDate(5) },
      { title: '会员日提醒', channel: 'sms', sentCount: 200, readCount: 120, successCount: 150, failCount: 50, status: 'partial', content: '会员日专属优惠已到账', createdAt: randomDate(2) },
    ]);
    await prRepo.save(records);
    console.log(`✅ 推送记录: ${records.length}条`);
  }

  // ========== 22. 系统设置 ==========
  const ssRepo = ds.getRepository(SystemSetting);
  if ((await ssRepo.count()) > 0) { console.log('⏭ 系统设置已存在，跳过'); } else {
    const settings = ssRepo.create([
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
    ]);
    await ssRepo.save(settings);
    console.log(`✅ 系统设置: ${settings.length}条`);
  }

  // ========== 23. 系统日志 ==========
  const slRepo = ds.getRepository(SystemLog);
  if ((await slRepo.count()) > 0) { console.log('⏭ 系统日志已存在，跳过'); } else {
    const sysLogs: Partial<SystemLog>[] = [];
    const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
    const sources = ['AuthService', 'OrderService', 'UserService', 'System', 'PaymentService'];
    const actions = ['用户登录', '创建订单', '数据备份', '内存告警', '支付超时', '缓存清理', '连接池满', '文件上传'];
    const modules = ['auth', 'order', 'system', 'system', 'payment'];
    for (let i = 0; i < 25; i++) {
      const u = allUsers[i % allUsers.length];
      sysLogs.push({ userId: u?.id || 1, username: u?.username || 'admin', action: actions[i % 8], module: modules[i % 5], level: levels[i % 5], result: levels[i % 5] === 'ERROR' ? 'failed' : 'success', source: sources[i % 5], device: randomItem(['Server', 'Worker-1', 'Worker-2']), ip: `10.0.0.${Math.floor(Math.random()*255)}`, detail: `${actions[i % 8]}操作详情...`, createdAt: randomDate(30) });
    }
    await slRepo.save(slRepo.create(sysLogs));
    console.log(`✅ 系统日志: 25条`);
  }

  console.log('\n🎉 所有假数据插入完成！');
  await ds.destroy();
}

seed().catch(err => { console.error('❌ 种子数据插入失败:', err); process.exit(1); });
