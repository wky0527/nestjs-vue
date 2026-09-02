import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get(':userId')
  async getCart(@Param('userId') userId: number) {
    return this.cartService.getCart(userId);
  }

  @Get(':userId/stats')
  async getStats(@Param('userId') userId: number) {
    return this.cartService.getCartStats(userId);
  }

  @Post('add')
  async addToCart(@Body() body: { userId: number; productId: number; quantity?: number; spec?: string }) {
    return this.cartService.addToCart(body.userId, body.productId, body.quantity || 1, body.spec);
  }

  @Put(':id/quantity')
  async updateQuantity(
    @Param('id') id: number,
    @Body() body: { userId: number; quantity: number },
  ) {
    return this.cartService.updateQuantity(id, body.userId, body.quantity);
  }

  @Put(':id/checked')
  async toggleChecked(
    @Param('id') id: number,
    @Body() body: { userId: number; checked: boolean },
  ) {
    return this.cartService.toggleChecked(id, body.userId, body.checked);
  }

  @Put(':userId/check-all')
  async toggleAllChecked(
    @Param('userId') userId: number,
    @Body() body: { checked: boolean },
  ) {
    return this.cartService.toggleAllChecked(userId, body.checked);
  }

  @Delete(':id')
  async removeItem(@Param('id') id: number, @Query('userId') userId: number) {
    return this.cartService.removeItem(id, userId);
  }

  @Delete(':userId/clear')
  async clearCart(@Param('userId') userId: number) {
    return this.cartService.clearCart(userId);
  }

  @Post('checkout')
  async checkout(@Body() body: {
    userId: number;
    address: string;
    receiverName: string;
    receiverPhone: string;
    paymentMethod: string;
    remark?: string;
    itemIds?: number[];
  }) {
    return this.cartService.checkout(body.userId, body);
  }
}
