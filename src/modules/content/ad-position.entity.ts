import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class AdPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 标识如 home_banner

  @Column()
  name: string; // 位置描述

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
