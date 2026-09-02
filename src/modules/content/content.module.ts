import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ContentCategory } from './content-category.entity';
import { Ad } from './ad.entity';
import { AdPosition } from './ad-position.entity';
import { Announcement } from './announcement.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Article, ContentCategory, Ad, AdPosition, Announcement])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
