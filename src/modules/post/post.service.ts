import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CreatePostDto } from './dtos/post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import {
  DataSource,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { S3Service } from 'src/app/plugins/s3.service';

import {
  ConflictMessages,
  EntityNameEnum,
  NotFoundMessages,
  PublicMessage,
  StatusEnum,
} from 'src/common/enums';
import { createSlug } from 'src/common/utils/function.util';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CategoryService } from '../category/category.service';
import { FormField } from '../category/types/FormFileds.type';
import { FileEntity } from 'src/common/entities/file.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Like, IsNull } from 'typeorm';
import { SearchPostDto } from './dtos/search-post.dto';
import { PaginationDto } from 'src/common/dtos/paginationQuery.dto';
import {
  paginationGenerator,
  paginationSolver,
} from 'src/common/utils/pagination.utils';
@Injectable({ scope: Scope.REQUEST })
export default class PostService {
  constructor(

    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly s3Service: S3Service,
    private readonly categoryService: CategoryService,
    private readonly dataSource: DataSource,
  ) {}

  async checkExistPost(title: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { title, userId },
    });
    if (post) throw new ConflictException(ConflictMessages.post);
  }
  async createPost(postDto: CreatePostDto, mediaFiles: Express.Multer.File[]) {
    return await this.dataSource.transaction(async (manager) => {
      // check post already exist
      const Existpost = await manager.findOne(PostEntity, {
        where: { title: postDto.title, userId: this.request.user.id },
      });
      if(Existpost) throw new ConflictException(ConflictMessages.post);
      // check if category exist and check formData is valid
      const category = await this.categoryService.findOne(postDto.categoryId);
      this.validateFormData(postDto.options, category.formFields);

      // Create a new post entity
      const post = manager.create(PostEntity, {
        categoryId: postDto.categoryId,
        userId: this.request.user.id,
        title: postDto.title,
        description: postDto.description,

        slug: createSlug(postDto.title),
        options: postDto.options,
    
        city: postDto.city,

        province: postDto.province,
        allowChatMessages: postDto.allowChatMessages,
        location: postDto.location,
        mediaFiles: [],
      });

      if (mediaFiles && mediaFiles.length > 0) {
        const uploadedFiles: FileEntity[] = [];

        for (const file of mediaFiles) {
          const uploadResult = await this.s3Service.upload(file, 'posts');

          // Create FileEntity object with required properties
          const fileEntity: FileEntity = {
            size: file.size,
            mimetype: file.mimetype,
            url: uploadResult.Url,
            key: uploadResult.Key,
          };

          uploadedFiles.push(fileEntity);
        }

        // Assign uploaded files to post
        post.mediaFiles = uploadedFiles;
      }

      // Save the post to the database
      await manager.save(post);
      return {
        message: PublicMessage.Created_Post,
      };
    });
  }
  async createPostPage(slug: string) {
    // جستجوی دسته اصلی انتخاب شده
    let category: CategoryEntity | null = null;
    let showBack = false;
    let where: FindOptionsWhere<CategoryEntity> = {
      parentId: IsNull(),
    };

    if (slug) {
      showBack = true;
      category = await this.dataSource.manager.findOne(CategoryEntity, {
        where: {
          slug: slug.trim(),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          formFields: true,
        },
      });

      if (!category) throw new NotFoundException(NotFoundMessages.Category);

      where = {
        parentId: category.id,
      };
    }

    const categories = await this.dataSource.manager.find(CategoryEntity, {
      where,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    return {
      categories,
      category,
      showBack,
    };
  }
  async findOneById(id: string) {}
  async getOne(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!post) throw new NotFoundException(NotFoundMessages.Post);
    return post;
  }

  async searchCategories(searchQuery: string) {
    // جستجوی دسته‌بندی‌ها بر اساس عنوان با استفاده از LIKE
    const categories = await this.dataSource.manager.find(CategoryEntity, {
      where: searchQuery
        ? {
            title: Like(`%${searchQuery}%`),
          }
        : {},
      relations: ['icon'], // اضافه کردن رابطه با آیکون
    });

    // جمع‌آوری نتایج
    const results: {
      category: CategoryEntity & { hasFormFields: boolean };
      postCount: number;
      categoryWithFormFields: CategoryEntity;
    }[] = [];

    for (const category of categories) {
      // بررسی آیا دسته اصلی دارای formFields است
      const hasDirectFormFields =
        category.formFields && category.formFields.length > 0;

      // بررسی زیردسته‌های سطح ۲
      const level2Categories = await this.dataSource.manager.find(
        CategoryEntity,
        {
          where: { parentId: category.id },
        },
      );

      let hasSubcategoryFormFields = false;
      let categoryWithFormFields: CategoryEntity | null = null;

      // بررسی formFields در زیردسته‌های سطح ۲
      for (const level2Category of level2Categories) {
        if (level2Category.formFields && level2Category.formFields.length > 0) {
          hasSubcategoryFormFields = true;
          categoryWithFormFields = level2Category;
          break;
        }

        // بررسی زیردسته‌های سطح ۳
        const level3Categories = await this.dataSource.manager.find(
          CategoryEntity,
          {
            where: { parentId: level2Category.id },
          },
        );

        for (const level3Category of level3Categories) {
          if (
            level3Category.formFields &&
            level3Category.formFields.length > 0
          ) {
            hasSubcategoryFormFields = true;
            categoryWithFormFields = level3Category;
            break;
          }
        }

        if (hasSubcategoryFormFields) break;
      }

      // اگر خود دسته یا یکی از زیردسته‌ها formFields داشت، به نتایج اضافه کن
      if (hasDirectFormFields || hasSubcategoryFormFields) {
        // شمارش تعداد آگهی‌های این دسته
        const postCount = await this.postRepository.count({
          where: { categoryId: category.id },
        });

        results.push({
          category: {
            ...category,
            hasFormFields: hasDirectFormFields,
          },
          postCount,
          categoryWithFormFields: categoryWithFormFields || category,
        });
      }
    }

    return results;
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

  async searchPosts(filterDto: SearchPostDto, paginationDto: PaginationDto) {
    const { page, limit, skip } = paginationSolver(paginationDto);
    let {
      categorySlug,
      province,
      city,
      options,
      search,
      sortBy,
      priceRange,
      chat,
      hasImage,
    } = filterDto;

    const queryBuilder = this.postRepository
      .createQueryBuilder(EntityNameEnum.Post)
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('category.parent', 'parentCategory')
      .leftJoin('parentCategory.parent', 'grandParentCategory')
      .select(['post', 'category.id', 'category.slug'])
      .where('post.status = :status', { status: StatusEnum.Published });
    // Filter by search term
    if (search) {
      queryBuilder.andWhere(
        'CONCAT(post.title,post.description) LIKE :search',
        { search: `%${search}%` },
      );
    }

    // Filter by category
    if (categorySlug) {
      queryBuilder.andWhere(
        '(category.slug = :categorySlug OR parentCategory.slug = :categorySlug OR grandParentCategory.slug = :categorySlug)',
        { categorySlug },
      );
    }
    // Apply dynamic options filters
    await this.applyOptionsFilter(queryBuilder, options, categorySlug);

    // Filter by location
    if (province) {
      queryBuilder.andWhere('post.province = :province', { province });
    }

    if (city) {
      queryBuilder.andWhere('post.city = :city', { city });
    }

    // Filter by price range
    if (priceRange) {
      const [min, max] = priceRange.split('-');

      if (min && !isNaN(Number(min))) {
        queryBuilder.andWhere(
          '(CAST(JSON_EXTRACT(post.options, "$.price") AS UNSIGNED) >= :minPrice OR CAST(JSON_EXTRACT(post.options, "$.deposit") AS UNSIGNED) >= :minPrice)',
          {
            minPrice: Number(min),
          },
        );
      }

      if (max && !isNaN(Number(max))) {
        queryBuilder.andWhere(
          '(CAST(JSON_EXTRACT(post.options, "$.price") AS UNSIGNED) <= :maxPrice OR CAST(JSON_EXTRACT(post.options, "$.deposit") AS UNSIGNED) <= :maxPrice)',
          {
            maxPrice: Number(max),
          },
        );
      }
    }

    // Only show posts that allow chat
    if (chat) {
      queryBuilder.andWhere('post.allowChatMessages = :chat', { chat: true });
    }

    // Only show posts with images
    if (hasImage) {
      queryBuilder.andWhere('JSON_LENGTH(post.mediaFiles) > 0');
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        queryBuilder.orderBy('post.created_at', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('post.created_at', 'ASC');
        break;
      case 'cheapest':
        queryBuilder.orderBy(
          'CAST(JSON_EXTRACT(post.options, "$.price") AS UNSIGNED)',
          'ASC',
        );
        break;
      case 'expensive':
        queryBuilder.orderBy(
          'CAST(JSON_EXTRACT(post.options, "$.price") AS UNSIGNED)',
          'DESC',
        );
        break;
      default:
        // Default sort by newest
        queryBuilder.orderBy('post.created_at', 'DESC');
    }

    // pagination
    const [posts, total] = await queryBuilder
      .limit(limit)
      .skip(skip)
      .getManyAndCount();

    return {
      posts,
      meta: paginationGenerator(total, page, limit),
    };
  }

  private async applyOptionsFilter(
    queryBuilder: SelectQueryBuilder<PostEntity>,
    options?: Record<string, any>,
    categorySlug?: string,
  ) {
    if (!options || !categorySlug) return;

    const category = await this.dataSource
      .getRepository(CategoryEntity)
      .findOne({
        where: { slug: categorySlug },
        select: ['id', 'formFields'],
      });

    if (!category || !category.formFields?.length) return;

    const formFieldsMap = new Map(
      category.formFields.map((f) => [f.name, f.type]),
    );

    for (const [fieldName, value] of Object.entries(options)) {
      if (value === undefined || value === null) continue;

      const fieldType = formFieldsMap.get(fieldName);
      if (!fieldType) continue;
      const jsonPath = `JSON_EXTRACT(post.options, '$.${fieldName}')`;
      switch (fieldType) {
        case 'number':
          if (typeof value === 'object' && (value.min || value.max)) {
            if (value.min) {
              queryBuilder.andWhere(`${jsonPath} >= :${fieldName}_min`, {
                [`${fieldName}_min`]: value.min,
              });
            }
            if (value.max) {
              queryBuilder.andWhere(`${jsonPath} <= :${fieldName}_max`, {
                [`${fieldName}_max`]: value.max,
              });
            }
          } else if (typeof value === 'number') {
            queryBuilder.andWhere(`${jsonPath} = :${fieldName}`, {
              [fieldName]: value,
            });
          }
          break;

        case 'select':
          queryBuilder.andWhere(`${jsonPath} IN (:...${fieldName})`, {
            [fieldName]: Array.isArray(value) ? value : [value],
          });
          break;

        case 'text':
          queryBuilder.andWhere(
            `JSON_UNQUOTE(${jsonPath}) LIKE :${fieldName}`,
            { [fieldName]: `%${value}%` },
          );
          break;

        case 'checkbox':
          queryBuilder.andWhere(`${jsonPath} = :${fieldName}`, {
            [fieldName]: !!value,
          });
          break;
      }
    }
  }
  async getPostBySlug(slug: string) {
    const post = await this.postRepository.findOne({
      where: { slug, status: StatusEnum.Published },
      relations: { category: true, user: true },
      select: {
        user: {
          id: true,
          phone: true,
        },
        category: {
          id: true,
          title: true,
          slug: true,
          formFields: true,
        },
      },
    });

    if (!post) throw new NotFoundException(NotFoundMessages.Post);

    // Transform options based on formFields
    if (post.category?.formFields && post.options) {
      const formFields = post.category.formFields;
      const transformedOptions = {};

      for (const field of formFields) {
        if (
          field.name &&
          field.label &&
          post.options[field.name] !== undefined
        ) {
          transformedOptions[field.label] = post.options[field.name];
        }
      }

      post.options = transformedOptions;
    }

    return {
      post,
    };
  }
}
