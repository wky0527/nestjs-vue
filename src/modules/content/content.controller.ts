import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  // Articles
  @Get('article/list')
  async findAllArticles(@Query() query: any) {
    return this.contentService.findAllArticles(query);
  }

  @Get('article/stats')
  async getArticleStats() {
    return this.contentService.getArticleStats();
  }

  @Post('article/batch')
  async batchArticle(@Body() body: { action: string; ids: number[] }) {
    return this.contentService.batchArticle(body.action, body.ids);
  }

  @Get('article/:id')
  async findOneArticle(@Param('id') id: number) {
    return this.contentService.findOneArticle(id);
  }

  @Post('article/create')
  async createArticle(@Body() body: any) {
    return this.contentService.createArticle(body);
  }

  @Put('article/:id')
  async updateArticle(@Param('id') id: number, @Body() body: any) {
    return this.contentService.updateArticle(id, body);
  }

  @Delete('article/:id')
  async deleteArticle(@Param('id') id: number) {
    return this.contentService.deleteArticle(id);
  }

  // Categories
  @Get('category/list')
  async findAllCategories() {
    return this.contentService.findAllCategories();
  }

  @Post('category/create')
  async createCategory(@Body() body: any) {
    return this.contentService.createCategory(body);
  }

  @Put('category/:id')
  async updateCategory(@Param('id') id: number, @Body() body: any) {
    return this.contentService.updateCategory(id, body);
  }

  @Delete('category/:id')
  async deleteCategory(@Param('id') id: number) {
    return this.contentService.deleteCategory(id);
  }

  // Ad Positions
  @Get('ad-position/list')
  async findAllAdPositions() {
    return this.contentService.findAllAdPositions();
  }

  @Post('ad-position')
  async createAdPosition(@Body() body: any) {
    return this.contentService.createAdPosition(body);
  }

  @Put('ad-position/:id')
  async updateAdPosition(@Param('id') id: number, @Body() body: any) {
    return this.contentService.updateAdPosition(id, body);
  }

  @Delete('ad-position/:id')
  async deleteAdPosition(@Param('id') id: number) {
    return this.contentService.deleteAdPosition(id);
  }

  // Ads
  @Get('ad/list')
  async findAllAds(@Query('positionId') positionId?: number) {
    return this.contentService.findAllAds(positionId);
  }

  @Post('ad/create')
  async createAd(@Body() body: any) {
    return this.contentService.createAd(body);
  }

  @Put('ad/:id')
  async updateAd(@Param('id') id: number, @Body() body: any) {
    return this.contentService.updateAd(id, body);
  }

  @Delete('ad/:id')
  async deleteAd(@Param('id') id: number) {
    return this.contentService.deleteAd(id);
  }

  // Announcements
  @Get('announcement/list')
  async findAllAnnouncements(@Query() query: any) {
    return this.contentService.findAllAnnouncements(query);
  }

  @Post('announcement/create')
  async createAnnouncement(@Body() body: any) {
    return this.contentService.createAnnouncement(body);
  }

  @Put('announcement/:id')
  async updateAnnouncement(@Param('id') id: number, @Body() body: any) {
    return this.contentService.updateAnnouncement(id, body);
  }

  @Delete('announcement/:id')
  async deleteAnnouncement(@Param('id') id: number) {
    return this.contentService.deleteAnnouncement(id);
  }
}
