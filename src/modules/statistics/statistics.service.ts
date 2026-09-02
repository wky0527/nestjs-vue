import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';
import { Product } from '../product/product.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async getOverview() {
    const totalUsers = await this.userRepo.count();
    const totalOrders = await this.orderRepo.count();
    const totalProducts = await this.productRepo.count();
    const totalSales = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.amount)', 'total')
      .where('order.status IN (:...statuses)', { statuses: ['已付款', '已发货', '已完成'] })
      .getRawOne();

    return { totalUsers, totalOrders, totalProducts, totalSales: totalSales?.total || 0 };
  }

  async getDashboard() {
    const overview = await this.getOverview();
    const recentOrders = await this.orderRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Generate visit trend data (mock for now, replace with real analytics)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const visitTrend = days.map((day, i) => ({
      day,
      thisWeek: Math.floor(Math.random() * 3000) + 1000,
      lastWeek: Math.floor(Math.random() * 2500) + 800,
    }));

    const userSources = [
      { name: '直接访问', value: 35 },
      { name: '搜索引擎', value: 30 },
      { name: '社交媒体', value: 20 },
      { name: '外部链接', value: 10 },
      { name: '其他', value: 5 },
    ];

    return { ...overview, recentOrders, visitTrend, userSources };
  }

  async getVisitAnalysis(period: string) {
    const days = period === 'today' ? ['0时', '6时', '12时', '18时'] :
                 period === 'week' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] :
                 Array.from({ length: 30 }, (_, i) => `${i + 1}日`);

    const trend = days.map(day => ({
      day,
      pv: Math.floor(Math.random() * 5000) + 1000,
      uv: Math.floor(Math.random() * 2000) + 500,
      ip: Math.floor(Math.random() * 1500) + 300,
    }));

    return {
      stats: {
        pv: trend.reduce((s, d) => s + d.pv, 0),
        uv: trend.reduce((s, d) => s + d.uv, 0),
        ip: trend.reduce((s, d) => s + d.ip, 0),
        avgDuration: Math.floor(Math.random() * 300) + 60,
        bounceRate: Math.floor(Math.random() * 30) + 20,
      },
      trend,
      sources: [
        { name: '直接访问', value: 35 },
        { name: '搜索引擎', value: 30 },
        { name: '社交媒体', value: 20 },
        { name: '外部链接', value: 10 },
        { name: '其他', value: 5 },
      ],
      pageRanking: [
        { url: '/dashboard', pv: 5230, uv: 1820, avgDuration: 125, bounceRate: 22 },
        { url: '/products', pv: 4120, uv: 1560, avgDuration: 98, bounceRate: 35 },
        { url: '/orders', pv: 3890, uv: 1340, avgDuration: 156, bounceRate: 18 },
        { url: '/users', pv: 2450, uv: 890, avgDuration: 87, bounceRate: 42 },
        { url: '/content', pv: 1980, uv: 720, avgDuration: 210, bounceRate: 15 },
      ],
    };
  }

  async getSalesReport(period: string) {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.amount)', 'amount')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.status IN (:...statuses)', { statuses: ['已付款', '已发货', '已完成'] })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    const totalSales = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const totalOrders = orders.reduce((s, o) => s + Number(o.count || 0), 0);

    return {
      stats: {
        totalSales,
        totalOrders,
        avgOrderAmount: totalOrders > 0 ? totalSales / totalOrders : 0,
        conversionRate: 3.2,
      },
      trend: orders.reverse(),
      productRanking: [
        { name: 'iPhone 15 Pro Max', category: '手机', sales: 234, amount: 2339766, percentage: 18 },
        { name: 'MacBook Pro 14', category: '电脑', sales: 156, amount: 2339844, percentage: 15 },
        { name: 'AirPods Pro 2', category: '耳机', sales: 432, amount: 820368, percentage: 12 },
        { name: 'iPad Air 5', category: '平板', sales: 198, amount: 871002, percentage: 9 },
        { name: 'Apple Watch S9', category: '手表', sales: 167, amount: 500833, percentage: 7 },
      ],
      categoryDistribution: [
        { name: '手机', value: 35 },
        { name: '电脑', value: 25 },
        { name: '耳机', value: 15 },
        { name: '平板', value: 13 },
        { name: '手表', value: 12 },
      ],
      channelAnalysis: [
        { channel: 'App', orders: 450, amount: 125000 },
        { channel: '小程序', orders: 320, amount: 89000 },
        { channel: 'H5', orders: 180, amount: 52000 },
        { channel: 'PC', orders: 250, amount: 78000 },
      ],
    };
  }

  async getUserProfile(period: string) {
    const totalUsers = await this.userRepo.count();
    const activeUsers = await this.userRepo.count({ where: { status: 'active' } });

    return {
      stats: {
        totalUsers,
        activeUsers,
        newUsers: Math.floor(totalUsers * 0.08),
        returnUsers: Math.floor(totalUsers * 0.15),
      },
      gender: [
        { name: '男', value: 55 },
        { name: '女', value: 38 },
        { name: '未知', value: 7 },
      ],
      age: [
        { range: '18岁以下', count: 120 },
        { range: '18-24岁', count: 350 },
        { range: '25-34岁', count: 580 },
        { range: '35-44岁', count: 280 },
        { range: '45岁以上', count: 150 },
      ],
      device: [
        { name: 'iOS', value: 42 },
        { name: 'Android', value: 38 },
        { name: 'PC', value: 15 },
        { name: '其他', value: 5 },
      ],
      newUserRatio: 32,
      dauTrend: Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        dau: Math.floor(Math.random() * 500) + 200,
        wau: Math.floor(Math.random() * 2000) + 800,
      })),
      tags: ['高消费', '高频购买', '新品偏好', '价格敏感', '品牌忠诚', '活跃用户', '沉默用户', '回流用户', '大促偏好', '社交分享'],
    };
  }

  async getSalesReportRaw() {
    return this.orderRepo
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.amount)', 'amount')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.status IN (:...statuses)', { statuses: ['已付款', '已发货', '已完成'] })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();
  }

  async getUserLevelStats() {
    return this.userRepo
      .createQueryBuilder('user')
      .select('user.level', 'level')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.level')
      .getRawMany();
  }

  async getOrderStatusStats() {
    return this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany();
  }
}
