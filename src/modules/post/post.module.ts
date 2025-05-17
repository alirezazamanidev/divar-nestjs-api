import { Module } from '@nestjs/common';
import PostService from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { S3Service } from 'src/app/plugins/s3.service';
import { CategoryModule } from '../category/category.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    CategoryModule,


  ],
  controllers: [PostController],
  providers: [
    PostService,
    S3Service,
  ],
})
export class PostModule {}
