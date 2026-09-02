import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MemberLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 普通/白银/黄金/钻石/皇冠

  @Column({ nullable: true })
  icon: string;

  @Column({ default: 0 })
  growthThreshold: number; // 所需成长值

  @Column('decimal', { precision: 3, scale: 2, default: 1.0 })
  discountRate: number; // 折扣率

  @Column('text', { nullable: true })
  benefits: string; // 权益描述

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
