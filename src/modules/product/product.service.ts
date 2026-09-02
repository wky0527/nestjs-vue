import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan, MoreThan, Between } from 'typeorm';
import { Product } from './product.entity';
import { ProductCategory } from './product-category.entity';
import { ProductBrand } from './product-brand.entity';
import { ProductSpec } from './product-spec.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductCategory) private categoryRepo: Repository<ProductCategory>,
    @InjectRepository(ProductBrand) private brandRepo: Repository<ProductBrand>,
    @InjectRepository(ProductSpec) private specRepo: Repository<ProductSpec>,
  ) {}

  async findAll(query: any) {
    const { name, categoryId, brandId, isOnSale, minPrice, maxPrice, page = 1, pageSize = 10 } = query;
    const where: any = {};
    if (name) where.name = Like(`%${name}%`);
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (isOnSale !== undefined && isOnSale !== '') where.isOnSale = isOnSale === 'true';
    if (minPrice !== undefined && minPrice !== '' && maxPrice !== undefined && maxPrice !== '') {
      where.price = Between(Number(minPrice), Number(maxPrice));
    } else if (minPrice !== undefined && minPrice !== '') {
      where.price = MoreThan(Number(minPrice));
    } else if (maxPrice !== undefined && maxPrice !== '') {
      where.price = LessThan(Number(maxPrice));
    }

    const [data, total] = await this.productRepo.findAndCount({
      where,
      relations: ['category', 'brand'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: number) {
    return this.productRepo.findOne({ where: { id }, relations: ['category', 'brand'] });
  }

  async create(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async update(id: number, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.productRepo.findOne({ where: { id } });
  }

  async delete(id: number) {
    return this.productRepo.delete(id);
  }

  async batchUpdate(action: string, ids: number[]) {
    for (const id of ids) {
      if (action === 'onSale') await this.productRepo.update(id, { isOnSale: true });
      else if (action === 'offSale') await this.productRepo.update(id, { isOnSale: false });
      else if (action === 'delete') await this.productRepo.delete(id);
    }
    return { success: true };
  }

  async toggleSale(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (product) {
      product.isOnSale = !product.isOnSale;
      return this.productRepo.save(product);
    }
    return null;
  }

  async getStats() {
    const total = await this.productRepo.count();
    const onSale = await this.productRepo.count({ where: { isOnSale: true } });
    const offSale = await this.productRepo.count({ where: { isOnSale: false } });
    const lowStock = await this.productRepo.count({ where: { stock: LessThan(10), isOnSale: true } });
    return { total, onSale, offSale, lowStock };
  }

  // Categories
  async findAllCategories() {
    const all = await this.categoryRepo.find({ order: { order: 'ASC' } });
    return this.buildCategoryTree(all, 0);
  }

  async findAllCategoriesFlat() {
    return this.categoryRepo.find({ order: { order: 'ASC' } });
  }

  private buildCategoryTree(categories: ProductCategory[], parentId: number): any[] {
    return categories
      .filter(c => c.parentId === parentId)
      .map(c => ({ ...c, children: this.buildCategoryTree(categories, c.id) }));
  }

  async createCategory(data: Partial<ProductCategory>) {
    const category = this.categoryRepo.create(data);
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: number, data: Partial<ProductCategory>) {
    await this.categoryRepo.update(id, data);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number) {
    const children = await this.categoryRepo.count({ where: { parentId: id } });
    if (children > 0) return { error: `该分类下有${children}个子分类，无法删除，请先转移。` };
    const products = await this.productRepo.count({ where: { categoryId: id } });
    if (products > 0) return { error: `该分类下有${products}个商品，无法删除，请先转移。` };
    return this.categoryRepo.delete(id);
  }

  // Brands
  async findAllBrands() {
    return this.brandRepo.find({ order: { order: 'ASC' } });
  }

  async createBrand(data: Partial<ProductBrand>) {
    const brand = this.brandRepo.create(data);
    return this.brandRepo.save(brand);
  }

  async updateBrand(id: number, data: Partial<ProductBrand>) {
    await this.brandRepo.update(id, data);
    return this.brandRepo.findOne({ where: { id } });
  }

  async deleteBrand(id: number) {
    const products = await this.productRepo.count({ where: { brandId: id } });
    if (products > 0) return { error: `该品牌下有${products}个商品，无法删除，请先更换商品品牌。` };
    return this.brandRepo.delete(id);
  }

  // Specs
  async findAllSpecs() {
    return this.specRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createSpec(data: Partial<ProductSpec>) {
    if (Array.isArray(data.values)) data.values = JSON.stringify(data.values);
    return this.specRepo.save(this.specRepo.create(data));
  }

  async updateSpec(id: number, data: Partial<ProductSpec>) {
    if (Array.isArray(data.values)) data.values = JSON.stringify(data.values);
    await this.specRepo.update(id, data);
    return this.specRepo.findOne({ where: { id } });
  }

  async deleteSpec(id: number) {
    return this.specRepo.delete(id);
  }
}
