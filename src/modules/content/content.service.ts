import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from './article.entity';
import { ContentCategory } from './content-category.entity';
import { Ad } from './ad.entity';
import { AdPosition } from './ad-position.entity';
import { Announcement } from './announcement.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(ContentCategory) private categoryRepo: Repository<ContentCategory>,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(AdPosition) private adPositionRepo: Repository<AdPosition>,
    @InjectRepository(Announcement) private announcementRepo: Repository<Announcement>,
  ) {}

  // Articles
  async findAllArticles(query: any) {
    const { title, status, categoryId, page = 1, pageSize = 10 } = query;
    const where: any = {};
    if (title) where.title = Like(`%${title}%`);
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const [data, total] = await this.articleRepo.findAndCount({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOneArticle(id: number) {
    return this.articleRepo.findOne({ where: { id }, relations: ['category'] });
  }

  async createArticle(data: Partial<Article>) {
    return this.articleRepo.save(this.articleRepo.create(data));
  }

  async updateArticle(id: number, data: Partial<Article>) {
    await this.articleRepo.update(id, data);
    return this.articleRepo.findOne({ where: { id } });
  }

  async deleteArticle(id: number) {
    return this.articleRepo.delete(id);
  }

  async batchArticle(action: string, ids: number[]) {
    for (const id of ids) {
      if (action === 'publish') await this.articleRepo.update(id, { status: 'published' });
      else if (action === 'draft') await this.articleRepo.update(id, { status: 'draft' });
      else if (action === 'delete') await this.articleRepo.delete(id);
    }
    return { success: true };
  }

  async getArticleStats() {
    const total = await this.articleRepo.count();
    const published = await this.articleRepo.count({ where: { status: 'published' } });
    const draft = await this.articleRepo.count({ where: { status: 'draft' } });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayPublished = await this.articleRepo
      .createQueryBuilder('a')
      .where('a.status = :status', { status: 'published' })
      .andWhere('a.createdAt >= :today', { today: today.toISOString() })
      .getCount();
    return { total, published, draft, todayPublished };
  }

  // Categories
  async findAllCategories() {
    return this.categoryRepo.find({ order: { order: 'ASC' } });
  }

  async createCategory(data: Partial<ContentCategory>) {
    return this.categoryRepo.save(this.categoryRepo.create(data));
  }

  async updateCategory(id: number, data: Partial<ContentCategory>) {
    await this.categoryRepo.update(id, data);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number) {
    const articles = await this.articleRepo.count({ where: { categoryId: id } });
    if (articles > 0) return { error: `该分类下有${articles}篇文章，无法删除，请先转移。` };
    return this.categoryRepo.delete(id);
  }

  // Ad Positions
  async findAllAdPositions() {
    return this.adPositionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createAdPosition(data: Partial<AdPosition>) {
    return this.adPositionRepo.save(this.adPositionRepo.create(data));
  }

  async updateAdPosition(id: number, data: Partial<AdPosition>) {
    await this.adPositionRepo.update(id, data);
    return this.adPositionRepo.findOne({ where: { id } });
  }

  async deleteAdPosition(id: number) {
    return this.adPositionRepo.delete(id);
  }

  // Ads
  async findAllAds(positionId?: number) {
    const where: any = {};
    if (positionId) where.positionId = positionId;
    return this.adRepo.find({ where, order: { order: 'ASC' } });
  }

  async createAd(data: Partial<Ad>) {
    return this.adRepo.save(this.adRepo.create(data));
  }

  async updateAd(id: number, data: Partial<Ad>) {
    await this.adRepo.update(id, data);
    return this.adRepo.findOne({ where: { id } });
  }

  async deleteAd(id: number) {
    return this.adRepo.delete(id);
  }

  // Announcements
  async findAllAnnouncements(query?: any) {
    const { type, status, page = 1, pageSize = 10 } = query || {};
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    const [data, total] = await this.announcementRepo.findAndCount({
      where,
      order: { isTop: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async createAnnouncement(data: Partial<Announcement>) {
    return this.announcementRepo.save(this.announcementRepo.create(data));
  }

  async updateAnnouncement(id: number, data: Partial<Announcement>) {
    await this.announcementRepo.update(id, data);
    return this.announcementRepo.findOne({ where: { id } });
  }

  async deleteAnnouncement(id: number) {
    return this.announcementRepo.delete(id);
  }
}
