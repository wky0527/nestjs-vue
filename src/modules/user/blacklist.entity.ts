import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Blacklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  reason: string;

  @Column({ nullable: true })
  operatorName: string;

  @Column({ default: 'permanent' })
  banType: string; // permanent/1d/7d/30d/custom

  @Column({ nullable: true })
  banUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
