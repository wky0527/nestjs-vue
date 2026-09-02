import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ProductSpec {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // 颜色/尺寸/材质/版本

  @Column('text')
  values: string; // JSON array: ["红色","蓝色","黑色"]

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
