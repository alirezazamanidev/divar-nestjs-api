import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { ConflictMessages, NotFoundMessages, PublicMessage } from 'src/common/enums';
import { DataSource, Repository } from 'typeorm';
import { CreateCategoryDto } from '../dto/category.dto';
import { S3Service } from 'src/app/plugins/s3.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from 'src/modules/category/entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
  ) {}

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
      message: PublicMessage.Created,
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
}
