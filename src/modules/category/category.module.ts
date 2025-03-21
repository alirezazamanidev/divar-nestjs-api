import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryEntity } from './entities/category.entity';
import { S3Service } from '../../app/plugins/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, S3Service],
  exports: [CategoryService],
})
export class CategoryModule {}
