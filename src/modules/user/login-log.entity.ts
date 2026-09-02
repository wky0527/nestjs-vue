import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class LoginLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  device: string;

  @Column({ default: 'success' })
  result: string; // success/failed

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
