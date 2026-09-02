import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  userId: number;

  @Column()
  userName: string;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: '待付款' })
  status: string; // 待付款, 已付款, 已发货, 已完成, 已取消, 退款中, 已退款

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  logisticsCompany: string;

  @Column({ nullable: true })
  logisticsNo: string;

  @Column({ nullable: true })
  paymentMethod: string; // 在线支付/货到付款/余额支付

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true })
  spec: string; // 规格如 红色/128GB

  @Column({ nullable: true })
  receiverName: string;

  @Column({ nullable: true })
  receiverPhone: string;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
