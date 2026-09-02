import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { User } from './modules/user/user.entity';
import { MemberLevel } from './modules/user/member-level.entity';
import { Blacklist } from './modules/user/blacklist.entity';
import { LoginLog } from './modules/user/login-log.entity';
import { AuthModule } from './modules/auth/auth.module';
import { Role } from './modules/auth/role.entity';
import { Permission } from './modules/auth/permission.entity';
import { RolePermission } from './modules/auth/role-permission.entity';
import { Menu } from './modules/auth/menu.entity';
import { Button } from './modules/auth/button.entity';
import { OrderModule } from './modules/order/order.module';
import { Order } from './modules/order/order.entity';
import { AfterSale } from './modules/order/after-sale.entity';
import { ShippingCompany } from './modules/order/shipping-company.entity';
import { ShippingTemplate } from './modules/order/shipping-template.entity';
import { CartItem } from './modules/order/cart-item.entity';
import { ProductModule } from './modules/product/product.module';
import { Product } from './modules/product/product.entity';
import { ProductCategory } from './modules/product/product-category.entity';
import { ProductBrand } from './modules/product/product-brand.entity';
import { ProductSpec } from './modules/product/product-spec.entity';
import { ContentModule } from './modules/content/content.module';
import { Article } from './modules/content/article.entity';
import { ContentCategory } from './modules/content/content-category.entity';
import { Ad } from './modules/content/ad.entity';
import { AdPosition } from './modules/content/ad-position.entity';
import { Announcement } from './modules/content/announcement.entity';
import { MessageModule } from './modules/message/message.module';
import { Message } from './modules/message/message.entity';
import { MessageTemplate } from './modules/message/message-template.entity';
import { PushRecord } from './modules/message/push-record.entity';
import { SettingsModule } from './modules/settings/settings.module';
import { SystemSetting } from './modules/settings/system-setting.entity';
import { SystemLog } from './modules/settings/system-log.entity';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { UploadModule } from './modules/upload/upload.module';
import { AppService } from './app.service';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: process.env.SQLITE_PATH || 'dev.sqlite',
      autoSave: true,
      synchronize: true,
      entities: [
        User,
        Role,
        Permission,
        RolePermission,
        Menu,
        Button,
        MemberLevel,
        Blacklist,
        LoginLog,
        Order,
        AfterSale,
        ShippingCompany,
        ShippingTemplate,
        CartItem,
        Product,
        ProductCategory,
        ProductBrand,
        ProductSpec,
        Article,
        ContentCategory,
        Ad,
        AdPosition,
        Announcement,
        Message,
        MessageTemplate,
        PushRecord,
        SystemSetting,
        SystemLog,
      ],
    }),
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      RolePermission,
      Menu,
      Button,
      MemberLevel,
      Blacklist,
      LoginLog,
      Order,
      AfterSale,
      ShippingCompany,
      ShippingTemplate,
      CartItem,
      Product,
      ProductCategory,
      ProductBrand,
      ProductSpec,
      Article,
      ContentCategory,
      Ad,
      AdPosition,
      Announcement,
      Message,
      MessageTemplate,
      PushRecord,
      SystemSetting,
      SystemLog,
    ]),
    UserModule,
    AuthModule,
    OrderModule,
    ProductModule,
    ContentModule,
    MessageModule,
    SettingsModule,
    StatisticsModule,
    UploadModule,
  ],
  controllers: [],
  providers: [AppService, SeedService],
})
export class AppModule {}
