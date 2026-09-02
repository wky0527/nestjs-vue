import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { ProductBrand } from './product-brand.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  video: string;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoKeywords: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: 0 })
  sales: number;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ nullable: true })
  brandId: number;

  @Column({ default: true })
  isOnSale: boolean;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('text', { nullable: true })
  specs: string; // JSON string of specifications

  @ManyToOne(() => ProductCategory, cat => cat.products)
  @JoinColumn({ name: 'categoryId' })
  category: ProductCategory;

  @ManyToOne(() => ProductBrand, brand => brand.products)
  @JoinColumn({ name: 'brandId' })
  brand: ProductBrand;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
