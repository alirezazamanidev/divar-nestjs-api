import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';

import { NotFoundMessages } from 'src/common/enums';
import { S3Service } from 'src/app/plugins/s3.service';

import { FormField } from './types/FormFileds.type';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,

  ) {}
  async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(NotFoundMessages.Category);
    }

    return category;
  }
  async listCategories(slug?: string) {
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
      order: { created_at: 'ASC' },
    });

    return {
      currentCategory,
      categories,
      options,
      showBack,
    };
  }
}
