import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MenuService } from './modules/auth/menu.service';
import { SeedService } from './seed.service';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 静态文件服务 - 上传的图片
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // 添加全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 允许跨域请求
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 手动触发数据库同步（不删除现有数据）
  const dataSource = app.get(DataSource);
  await dataSource.synchronize(false);
  console.log('✅ 数据库同步完成');

  // 初始化数据
  const menuService = app.get(MenuService);
  await menuService.initializeDefaultRoles();    // 初始化角色
  await menuService.initializeDefaultMenus();    // 初始化菜单
  await menuService.initializeDefaultButtons();  // 初始化按钮

  // 填充种子数据
  const seedService = app.get(SeedService);
  await seedService.seedAll();

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
