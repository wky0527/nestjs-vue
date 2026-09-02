import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private cartRepo: Repository<CartItem>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /** 获取用户购物车列表 */
  async getCart(userId: number) {
    const items = await this.cartRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    // 检查商品是否仍上架、库存是否充足
    const result = [];
    for (const item of items) {
      const prod = await this.productRepo.findOne({ where: { id: item.productId } });
      result.push({
        ...item,
        productExists: !!prod,
        productOnSale: prod?.isOnSale ?? false,
        currentStock: prod?.stock ?? 0,
        currentPrice: prod?.price ?? item.price,
      });
    }
    return result;
  }

  /** 添加商品到购物车 */
  async addToCart(userId: number, productId: number, quantity: number = 1, spec?: string) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('商品不存在');
    if (!product.isOnSale) throw new NotFoundException('商品已下架');

    // 检查是否已在购物车
    const existing = await this.cartRepo.findOne({
      where: { userId, productId, spec: spec || null },
    });

    if (existing) {
      existing.quantity += quantity;
      existing.price = product.price; // 更新为最新价格
      return this.cartRepo.save(existing);
    }

    const item = this.cartRepo.create({
      userId,
      productId,
      productName: product.name,
      price: product.price,
      quantity,
      spec: spec || null,
      image: product.images?.[0] || null,
      checked: true,
    });
    return this.cartRepo.save(item);
  }

  /** 更新购物车商品数量 */
  async updateQuantity(id: number, userId: number, quantity: number) {
    const item = await this.cartRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('购物车项不存在');
    if (quantity <= 0) {
      await this.cartRepo.remove(item);
      return { deleted: true };
    }
    item.quantity = quantity;
    return this.cartRepo.save(item);
  }

  /** 切换选中状态 */
  async toggleChecked(id: number, userId: number, checked: boolean) {
    const item = await this.cartRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('购物车项不存在');
    item.checked = checked;
    return this.cartRepo.save(item);
  }

  /** 全选/取消全选 */
  async toggleAllChecked(userId: number, checked: boolean) {
    const items = await this.cartRepo.find({ where: { userId } });
    for (const item of items) {
      item.checked = checked;
    }
    return this.cartRepo.save(items);
  }

  /** 删除购物车项 */
  async removeItem(id: number, userId: number) {
    const item = await this.cartRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('购物车项不存在');
    await this.cartRepo.remove(item);
    return { success: true };
  }

  /** 清空购物车 */
  async clearCart(userId: number) {
    await this.cartRepo.delete({ userId });
    return { success: true };
  }

  /** 获取购物车统计 */
  async getCartStats(userId: number) {
    const items = await this.cartRepo.find({ where: { userId } });
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const checkedItems = items.filter(i => i.checked);
    const checkedCount = checkedItems.reduce((sum, i) => sum + i.quantity, 0);
    const checkedAmount = checkedItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    return { totalItems, checkedCount, checkedAmount: Number(checkedAmount.toFixed(2)) };
  }

  /** 从购物车结算创建订单 */
  async checkout(userId: number, checkoutData: {
    address: string;
    receiverName: string;
    receiverPhone: string;
    paymentMethod: string;
    remark?: string;
    itemIds?: number[]; // 指定结算的购物车项ID，不传则用选中的
  }) {
    const { address, receiverName, receiverPhone, paymentMethod, remark, itemIds } = checkoutData;

    // 获取要结算的购物车项
    let cartItems: CartItem[];
    if (itemIds && itemIds.length > 0) {
      cartItems = await this.cartRepo.findByIds(itemIds);
      cartItems = cartItems.filter(i => i.userId === userId);
    } else {
      cartItems = await this.cartRepo.find({ where: { userId, checked: true } });
    }

    if (cartItems.length === 0) throw new NotFoundException('没有可结算的商品');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const userName = user?.username || '未知用户';

    const createdOrders = [];

    for (const cartItem of cartItems) {
      const product = await this.productRepo.findOne({ where: { id: cartItem.productId } });
      if (!product || !product.isOnSale) continue;

      const amount = Number(cartItem.price) * cartItem.quantity;

      const order = this.orderRepo.create({
        orderNo: 'ORD' + Date.now() + Math.floor(Math.random() * 1000),
        userId,
        userName,
        productId: cartItem.productId,
        productName: cartItem.productName,
        amount,
        quantity: cartItem.quantity,
        spec: cartItem.spec,
        status: '待付款',
        address,
        receiverName,
        receiverPhone,
        paymentMethod,
        remark,
      });

      const savedOrder = await this.orderRepo.save(order);
      createdOrders.push(savedOrder);

      // 扣减库存、增加销量
      product.stock -= cartItem.quantity;
      product.sales += cartItem.quantity;
      await this.productRepo.save(product);
    }

    // 从购物车移除已结算项
    await this.cartRepo.remove(cartItems);

    return { orders: createdOrders, count: createdOrders.length };
  }
}
