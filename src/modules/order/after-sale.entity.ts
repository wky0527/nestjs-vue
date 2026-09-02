import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class AfterSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  orderNo: string;

  @Column()
  userId: number;

  @Column()
  userName: string;

  @Column({ default: '待处理' })
  status: string; // 待处理, 处理中, 已完成, 已拒绝

  @Column()
  type: string; // 仅退款/退货退款

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  rejectReason: string;

  @Column('text')
  reason: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  images: string; // JSON array of image URLs

  @Column({ nullable: true })
  handleResult: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
