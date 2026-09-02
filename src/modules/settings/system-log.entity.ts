import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class SystemLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  username: string;

  @Column()
  action: string;

  @Column()
  module: string;

  @Column({ default: 'operation' })
  type: string; // operation/system

  @Column({ default: 'INFO' })
  level: string; // INFO/WARN/ERROR

  @Column({ default: 'success' })
  result: string; // success/failed

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  source: string;

  @Column('text', { nullable: true })
  detail: string;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
