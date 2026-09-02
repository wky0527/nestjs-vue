import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MessageTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ default: 'inbox' })
  type: string; // sms/email/inbox

  @Column({ nullable: true })
  triggerEvent: string; // 订单支付成功/订单发货/退款成功/注册欢迎

  @Column({ nullable: true })
  subject: string; // 邮件主题

  @Column('text')
  content: string;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
