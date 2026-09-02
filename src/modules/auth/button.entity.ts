import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Menu } from './menu.entity';

@Entity()
export class Button {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column()
  action: string; // 如：create, edit, delete, view

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  roles: string[];

  @ManyToOne(() => Menu, menu => menu.id)
  @JoinColumn({ name: 'menuId' })
  menu: Menu;

  @Column()
  menuId: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}