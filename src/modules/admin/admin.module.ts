import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admIn.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from '../category/category.module';
import { CategoryController } from './controllers/cateegory.controller';
import { CategoryService } from './services/category.service';
import { S3Service } from 'src/app/plugins/s3.service';
import { CategoryEntity } from '../category/entities/category.entity';
@Module({
  imports:[TypeOrmModule.forFeature([CategoryEntity])],
  providers: [AdminService,CategoryService,S3Service],
  controllers: [AdminController,CategoryController],
})
export class AdminModule {}
