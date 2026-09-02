import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';
import { Product } from '../product/product.entity';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Product])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
