import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  senderId: number;

  @Column({ nullable: true })
  senderName: string;

  @Column({ nullable: true })
  receiverId: number;

  @Column({ nullable: true })
  receiverName: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: 'system' })
  type: string; // system, user

  @Column({ default: 'system' })
  category: string; // system/order/activity

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
