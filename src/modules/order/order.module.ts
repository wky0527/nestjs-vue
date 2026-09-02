import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { AfterSale } from './after-sale.entity';
import { ShippingCompany } from './shipping-company.entity';
import { ShippingTemplate } from './shipping-template.entity';
import { CartItem } from './cart-item.entity';
import { OrderService } from './order.service';
import { CartService } from './cart.service';
import { OrderController } from './order.controller';
import { CartController } from './cart.controller';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, AfterSale, ShippingCompany, ShippingTemplate, CartItem, Product, User])],
  controllers: [OrderController, CartController],
  providers: [OrderService, CartService],
  exports: [OrderService, CartService],
})
export class OrderModule {}
