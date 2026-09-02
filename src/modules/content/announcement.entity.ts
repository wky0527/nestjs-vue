import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ default: 'system' })
  type: string; // system/activity/maintenance

  @Column({ default: 'all' })
  scope: string; // all/users/roles

  @Column({ default: false })
  isTop: boolean;

  @Column({ default: 'published' })
  status: string; // draft/published

  @Column({ nullable: true })
  expireAt: Date;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  publishAt: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
