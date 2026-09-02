import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class PushRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  targetUsers: string; // JSON array of user IDs or 'all'

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  readCount: number;

  @Column({ nullable: true })
  templateName: string;

  @Column({ default: 'inbox' })
  channel: string; // inbox/sms/email

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 0 })
  failCount: number;

  @Column('text', { nullable: true })
  failDetail: string; // JSON

  @Column({ default: 'success' })
  status: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
