import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get('list')
  async findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.productService.getStats();
  }

  @Post('batch-update')
  async batchUpdate(@Body() body: { action: string; ids: number[] }) {
    return this.productService.batchUpdate(body.action, body.ids);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.productService.findOne(id);
  }

  @Post('create')
  async create(@Body() body: any) {
    return this.productService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.productService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.productService.delete(id);
  }

  @Post(':id/toggle-sale')
  async toggleSale(@Param('id') id: number) {
    return this.productService.toggleSale(id);
  }

  // Categories
  @Get('category/list')
  async findAllCategories() {
    return this.productService.findAllCategories();
  }

  @Post('category/create')
  async createCategory(@Body() body: any) {
    return this.productService.createCategory(body);
  }

  @Put('category/:id')
  async updateCategory(@Param('id') id: number, @Body() body: any) {
    return this.productService.updateCategory(id, body);
  }

  @Delete('category/:id')
  async deleteCategory(@Param('id') id: number) {
    return this.productService.deleteCategory(id);
  }

  // Brands
  @Get('brand/list')
  async findAllBrands() {
    return this.productService.findAllBrands();
  }

  @Post('brand/create')
  async createBrand(@Body() body: any) {
    return this.productService.createBrand(body);
  }

  @Put('brand/:id')
  async updateBrand(@Param('id') id: number, @Body() body: any) {
    return this.productService.updateBrand(id, body);
  }

  @Delete('brand/:id')
  async deleteBrand(@Param('id') id: number) {
    return this.productService.deleteBrand(id);
  }

  // Specs
  @Get('spec/list')
  async findAllSpecs() {
    return this.productService.findAllSpecs();
  }

  @Post('spec')
  async createSpec(@Body() body: any) {
    return this.productService.createSpec(body);
  }

  @Put('spec/:id')
  async updateSpec(@Param('id') id: number, @Body() body: any) {
    return this.productService.updateSpec(id, body);
  }

  @Delete('spec/:id')
  async deleteSpec(@Param('id') id: number) {
    return this.productService.deleteSpec(id);
  }
}
