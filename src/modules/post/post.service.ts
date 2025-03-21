import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { CreatePostDto } from './dtos/post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { S3Service } from 'src/app/plugins/s3.service';
import { FileEntity } from 'src/common/entities/file.entity';
import { ConflictMessages } from 'src/common/enums';
import { createSlug } from 'src/common/utils/function.util';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CategoryService } from '../category/category.service';
import { FormField } from '../category/types/FormFileds.type';

@Injectable({ scope: Scope.REQUEST })
export class PostService {
  constructor(
    private readonly DataSource:DataSource,
    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly s3Service: S3Service,
    private readonly categoryService: CategoryService,
  ) {}

  async checkExistPost(title: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { title, userId },
    });
    if (post) throw new ConflictException(ConflictMessages.post);
  }
  async createPost(postDto: CreatePostDto, mediaFiles: Express.Multer.File[]) {
    return await this.DataSource.transaction(async(manager)=>{
         // check if category exist and check formData is valid
    const category = await this.categoryService.findOne(postDto.categoryId);
    this.validateFormData(postDto.formData, category.formFields);
    // Create a new post entity
    const post = manager.create(PostEntity,{
      categoryId: postDto.categoryId,
      userId: this.request.user.id,
      title:postDto.title,
      description:postDto.description,
      slug: createSlug(postDto.title),
      formData: postDto.formData,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Upload media files to S3 if any
    if (mediaFiles && mediaFiles.length > 0) {
      const uploadedFiles: FileEntity[] = [];

      for (const file of mediaFiles) {
        const uploadResult = await this.s3Service.upload(file, 'posts');

        const fileEntity = new FileEntity();
        fileEntity.url = uploadResult.Url;
        fileEntity.key = uploadResult.Key;
        fileEntity.mimetype = file.mimetype;
        fileEntity.size = file.size;

        uploadedFiles.push(fileEntity);
      }

      post.mediaFiles = uploadedFiles;
    }

    // Save the post to the database
    await manager.save(post);
    return {
        message:'created!'
    }
    })
   
  }
  private validateFormData(
    formData: Record<string, any>,
    formFields: FormField[],
  ) {
    for (const field of formFields) {
      const value = formData[field.name];

      if (field.required && !value) {
        throw new BadRequestException(`${field.label} is required`);
      }

      if (value) {
        switch (field.type) {
          case 'number':
            if (isNaN(value)) {
              throw new BadRequestException(`${field.label} must be a number`);
            }
            if (
              field.validation?.min !== undefined &&
              value < field.validation.min
            ) {
              throw new BadRequestException(
                `${field.label} must be greater than or equal to ${field.validation.min}`,
              );
            }
            if (
              field.validation?.max !== undefined &&
              value > field.validation.max
            ) {
              throw new BadRequestException(
                `${field.label} must be less than or equal to ${field.validation.max}`,
              );
            }
            break;
          case 'select':
            if (field.options && !field.options.includes(value)) {
              throw new BadRequestException(
                `${field.label} must be one of: ${field.options.join(', ')}`,
              );
            }
            break;
          case 'text':
            if (
              field.validation?.pattern &&
              !new RegExp(field.validation.pattern).test(value)
            ) {
              throw new BadRequestException(
                `${field.label} has invalid format`,
              );
            }
            break;
        }
      }
    }
  }
}
