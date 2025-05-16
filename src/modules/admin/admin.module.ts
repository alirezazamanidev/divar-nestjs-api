import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admIn.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from '../category/category.module';
import { CategoryController } from './controllers/cateegory.controller';
import { CategoryService } from './services/category.service';
import { S3Service } from 'src/app/plugins/s3.service';
import { CategoryEntity } from '../category/entities/category.entity';
import { PostService } from './services/post.service';
import { PostController } from './controllers/post.controller';
import { PostEntity } from '../post/entities/post.entity';
@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, PostEntity])],
  providers: [AdminService, CategoryService, S3Service, PostService],
  controllers: [AdminController, CategoryController, PostController],
})
export class AdminModule {}
