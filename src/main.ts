
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

  // ==============================
  // 1. 上传文件目录
  // ==============================
  const uploadsDir = join(process.cwd(), 'uploads');

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  // ==============================
  // 2. 前端静态文件
  // ==============================
  const frontendDist = join(process.cwd(), 'frontend', 'dist');

  if (existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist);

    console.log(`✅ 前端目录: ${frontendDist}`);
  } else {
    console.warn(`⚠️ 前端目录不存在: ${frontendDist}`);
  }

  // ==============================
  // 3. 全局验证
  // ==============================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ==============================
  // 4. CORS
  // ==============================
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ==============================
  // 5. 数据库同步
  // ==============================
  const dataSource = app.get(DataSource);

  await dataSource.synchronize(false);

  console.log('✅ 数据库同步完成');

  // ==============================
  // 6. 初始化角色、菜单、按钮
  // ==============================
  const menuService = app.get(MenuService);

  await menuService.initializeDefaultRoles();
  await menuService.initializeDefaultMenus();
  await menuService.initializeDefaultButtons();

  // ==============================
  // 7. 种子数据
  // ==============================
  const seedService = app.get(SeedService);

  await seedService.seedAll();

  // ==============================
  // 8. SPA 路由处理
  // ==============================
  // Vue Router 使用 history 模式时：
  // /login
  // /dashboard
  // /order
  // /product
  // 等页面刷新后，需要返回 index.html
  //
  // 使用中间件方式避免 Express 5 的通配符问题
  app.use((req, res, next) => {
    // API、上传文件不走前端路由
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads')
    ) {
      return next();
    }

    // 只处理 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    const indexPath = join(frontendDist, 'index.html');

    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    next();
  });

  // ==============================
  // 9. 启动服务
  // ==============================
  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}

bootstrap()
