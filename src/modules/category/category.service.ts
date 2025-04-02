import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  DeepPartial,
  FindOptionsWhere,
  IsNull,
} from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  ConflictMessages,
  NotFoundMessages,
  PublicMessage,
} from 'src/common/enums';
import { S3Service } from 'src/app/plugins/s3.service';
import slugify from 'slugify';
import * as categoryData from '../../database/seeds/category.seed.json';

import { FormField } from './types/FormFileds.type';

interface CategoryResponse {
  currentCategory: CategoryEntity | null; // Current category
  categories: Partial<CategoryEntity>[]; // Subcategories
  options: FormField[]; // Filters or form fields
  showBack: boolean; // Whether to show a back button
  breadcrumbs: { id: string; title: string; slug: string }[]; // Parent hierarchy
}
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly s3Service: S3Service,
  ) {}

  async seed() {
    // Process top-level categories
    for (const category of categoryData.categories) {
      await this.createCategoryWithChildren(category);
    }

    return { success: true, message: 'Categories seeded successfully' };
  }

  private async createCategoryWithChildren(
    categoryData: any,
    parent?: CategoryEntity,
  ): Promise<CategoryEntity> {
    // Create category without children first
    const categoryToCreate: DeepPartial<CategoryEntity> = {
      title: categoryData.title,
      slug: categoryData.slug,
      description: categoryData.description,
      formFields: categoryData.formFields,
      parent: parent,
    };

    // Save the category to get an ID
    const savedCategory = await this.categoryRepository.save(categoryToCreate);

    // Process children if they exist
    if (categoryData.children && categoryData.children.length > 0) {
      for (const childData of categoryData.children) {
        await this.createCategoryWithChildren(childData, savedCategory);
      }
    }

    return savedCategory;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { parentId, title, description, icon, formFields } =
      createCategoryDto;
    if (parentId) {
      await this.findOne(parentId);
    }
    // check exist already category by title
    await this.checkExistByTitle(title);

    let category = this.categoryRepository.create({
      parentId,
      title,
      formFields,
      slug: slugify(title, {
        lower: true,
        strict: true,
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
      }),
      description,
      icon: {},
    });

    if (icon) {
      const { Url, Key } = await this.s3Service.upload(icon, 'category');
      category.icon.url = Url;
      category.icon.key = Key;
      category.icon.size = icon.size;
      category.icon.mimetype = icon.mimetype;
    }

    category = await this.categoryRepository.save(category);

    return {
      messsge: PublicMessage.Created,
    };
  }

  async checkExistByTitle(title: string) {
    const category = await this.categoryRepository.findOne({
      where: { title },
    });
    if (category) throw new ConflictException(ConflictMessages.category);
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(NotFoundMessages.Category);
    }

    return category;
  }

  async listCategories(slug?: string){
    // Initialize variables
    const options: FormField[] = [];
    let showBack = false;
    let currentCategory: CategoryEntity | null = null;
    const where: FindOptionsWhere<CategoryEntity> = { parentId: IsNull() };

    if (slug) {
      currentCategory = await this.categoryRepository.findOne({
        where: { slug },
        cache: true,
   
      });

      if (!currentCategory) {
        throw new NotFoundException(NotFoundMessages.Category);
      }

      // Update where clause to fetch subcategories
      where.parentId = currentCategory.id;
      showBack = true;

      // Populate options (filters) if available
      if (currentCategory.formFields?.length) {
        options.push(...currentCategory.formFields);
      }

    }

    // Fetch subcategories
    const categories = await this.categoryRepository.find({
      where,
      cache: true,
      select: {
        id: true,
        title: true,
        slug: true,
        created_at: true,
      },
      order: { created_at: 'ASC' }
    });

    return {
      currentCategory, 
      categories,     
      options,         
      showBack,        

    };
  }

 
}
