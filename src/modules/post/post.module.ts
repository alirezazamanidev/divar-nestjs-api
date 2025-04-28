import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { S3Service } from 'src/app/plugins/s3.service';
import { CategoryModule } from '../category/category.module';
import { SmartModerationService } from './aiContentChecker.service';
import { ModerationProcessor } from './moderation.proccess';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    CategoryModule,
    HttpModule.register({
      timeout: 10000,
    }),
    BullModule.registerQueue({
      name: 'moderation',
    
    }),
  ],
  controllers: [PostController],
  providers: [
    PostService,
    S3Service,
    SmartModerationService,
    ModerationProcessor,
  ],
})
export class PostModule {}
