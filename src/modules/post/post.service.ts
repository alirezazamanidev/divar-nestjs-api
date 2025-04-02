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
  FindOptions,
  FindOptionsWhere,
  Repository,
  In,
  QueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import { S3Service } from 'src/app/plugins/s3.service';

import {
  ConflictMessages,
  EntityNameEnum,
  NotFoundMessages,
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
export class PostService {
  constructor(
    private readonly DataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly s3Service: S3Service,
    private readonly categoryService: CategoryService,
    private readonly datasource: DataSource,
  ) {}

  async checkExistPost(title: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { title, userId },
    });
    if (post) throw new ConflictException(ConflictMessages.post);
  }
  async createPost(postDto: CreatePostDto, mediaFiles: Express.Multer.File[]) {
    return await this.DataSource.transaction(async (manager) => {
      // check post already exist
      await this.checkExistPost(postDto.title, this.request.user.id);
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      const savedPost = await manager.save(post);
      return {
        message: 'created!',
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
      category = await this.datasource.manager.findOne(CategoryEntity, {
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

    const categories = await this.datasource.manager.find(CategoryEntity, {
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
    const categories = await this.datasource.manager.find(CategoryEntity, {
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
      const level2Categories = await this.datasource.manager.find(
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
        const level3Categories = await this.datasource.manager.find(
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

  // متد جدید برای نمایش دسته‌بندی‌های اصلی (شبیه صفحه اصلی دیوار)
  async getMainCategories() {
    // دریافت همه دسته‌بندی‌های اصلی (دسته‌هایی که parentId ندارند)
    const mainCategories = await this.datasource.manager.find(CategoryEntity, {
      where: { parentId: IsNull() },
    });

    const result: {
      category: CategoryEntity;
      postCount: number;
      hasFormFields: boolean;
    }[] = [];

    for (const category of mainCategories) {
      // شمارش تعداد آگهی‌های این دسته
      const postCount = await this.postRepository.count({
        where: { categoryId: category.id },
      });

      // بررسی آیا خود دسته یا زیردسته‌های آن formFields دارند
      const hasFormFields =
        category.formFields && category.formFields.length > 0;
      let hasSubcategoryWithFormFields = false;

      if (!hasFormFields) {
        // بررسی زیردسته‌های سطح 2
        const level2Categories = await this.datasource.manager.find(
          CategoryEntity,
          {
            where: { parentId: category.id },
          },
        );

        for (const level2 of level2Categories) {
          if (level2.formFields && level2.formFields.length > 0) {
            hasSubcategoryWithFormFields = true;
            break;
          }

          // بررسی زیردسته‌های سطح 3
          const level3Categories = await this.datasource.manager.find(
            CategoryEntity,
            {
              where: { parentId: level2.id },
            },
          );

          for (const level3 of level3Categories) {
            if (level3.formFields && level3.formFields.length > 0) {
              hasSubcategoryWithFormFields = true;
              break;
            }
          }

          if (hasSubcategoryWithFormFields) break;
        }
      }

      // فقط دسته‌هایی را اضافه کن که خود یا زیردسته‌های آنها formFields داشته باشند
      if (hasFormFields || hasSubcategoryWithFormFields) {
        result.push({
          category,
          postCount,
          hasFormFields: hasFormFields || hasSubcategoryWithFormFields,
        });
      }
    }

    return result;
  }

  // متد جدید برای دریافت همه دسته‌بندی‌ها و زیردسته‌های آنها (برای نمایش کامل)
  async getAllCategoriesWithHierarchy() {
    // دریافت همه دسته‌بندی‌های اصلی
    const mainCategories = await this.datasource.manager.find(CategoryEntity, {
      where: { parentId: IsNull() },
    });

    const result: {
      category: CategoryEntity;
      hasFormFields: boolean;
      children: {
        category: CategoryEntity;
        hasFormFields: boolean;
        children: {
          category: CategoryEntity;
          hasFormFields: boolean;
        }[];
      }[];
      postCount: number;
    }[] = [];

    for (const mainCategory of mainCategories) {
      const level2Categories = await this.datasource.manager.find(
        CategoryEntity,
        {
          where: { parentId: mainCategory.id },
          relations: ['icon'],
        },
      );

      const level2WithChildren: {
        category: CategoryEntity;
        hasFormFields: boolean;
        children: {
          category: CategoryEntity;
          hasFormFields: boolean;
        }[];
      }[] = [];

      for (const level2 of level2Categories) {
        const level3Categories = await this.datasource.manager.find(
          CategoryEntity,
          {
            where: { parentId: level2.id },
            relations: ['icon'],
          },
        );

        level2WithChildren.push({
          category: level2,
          hasFormFields: level2.formFields && level2.formFields.length > 0,
          children: level3Categories.map((level3) => ({
            category: level3,
            hasFormFields: level3.formFields && level3.formFields.length > 0,
          })),
        });
      }

      // شمارش تعداد آگهی‌های این دسته
      const postCount = await this.postRepository.count({
        where: { categoryId: mainCategory.id },
      });

      result.push({
        category: mainCategory,
        hasFormFields:
          mainCategory.formFields && mainCategory.formFields.length > 0,
        children: level2WithChildren,
        postCount,
      });
    }

    return result;
  }

  // متد جدید برای پیشنهاد دسته‌بندی برای ایجاد آگهی
  async suggestCategoryForNewPost() {
    // دریافت دسته‌بندی‌های پربازدید یا محبوب
    // در اینجا ما ساده‌سازی کرده و دسته‌بندی‌های اصلی را که بیشترین آگهی را دارند بر می‌گردانیم

    // دریافت همه دسته‌بندی‌های اصلی
    const mainCategories = await this.datasource.manager.find(CategoryEntity, {
      where: { parentId: IsNull() },
    });

    const categoriesWithPostCount: {
      category: CategoryEntity;
      postCount: number;
    }[] = [];

    // محاسبه تعداد آگهی برای هر دسته‌بندی
    for (const category of mainCategories) {
      const postCount = await this.postRepository.count({
        where: { categoryId: category.id },
      });

      categoriesWithPostCount.push({ category, postCount });
    }

    // مرتب‌سازی بر اساس تعداد آگهی (نزولی)
    categoriesWithPostCount.sort((a, b) => b.postCount - a.postCount);

    // برگرداندن 5 دسته‌بندی اول (یا تمام آنها، اگر کمتر از 5 دسته‌بندی وجود دارد)
    return categoriesWithPostCount.slice(0, 5).map((item) => ({
      ...item,
      hasFormFields:
        item.category.formFields && item.category.formFields.length > 0,
    }));
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
      if (priceRange.min !== undefined) {
        queryBuilder.andWhere(
          'JSON_EXTRACT(post.options, "$.price") >= :minPrice',
          {
            minPrice: priceRange.min,
          },
        );
      }
      if (priceRange.max !== undefined) {
        queryBuilder.andWhere(
          'JSON_EXTRACT(post.options, "$.price") <= :maxPrice',
          {
            maxPrice: priceRange.max,
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

    const category = await this.datasource
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
}
