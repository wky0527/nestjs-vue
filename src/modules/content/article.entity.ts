import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContentCategory } from './content-category.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: true })
  summary: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  author: string;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ default: 'draft' })
  status: string; // draft, published

  @Column({ default: 0 })
  viewCount: number;

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoKeywords: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  publishAt: Date;

  @Column({ default: false })
  isTop: boolean;

  @ManyToOne(() => ContentCategory, cat => cat.articles)
  @JoinColumn({ name: 'categoryId' })
  category: ContentCategory;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
