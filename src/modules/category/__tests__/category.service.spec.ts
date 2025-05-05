import { Test } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { CategoryEntity } from '../entities/category.entity';
import { IsNull, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { S3Service } from 'src/app/plugins/s3.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { PublicMessage } from 'src/common/enums';
function createMockCategory(overrides?: Partial<CategoryEntity>) {
  return {
    id: 'default-id',
    title: 'default-title',
    slug: 'default-slug',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}
describe('CategoryService', () => {
  let service: CategoryService;
  let mockCategoryRepository: MockProxy<Repository<CategoryEntity>>;
  let mockS3service: MockProxy<S3Service>;
  let mockCategory: Partial<CategoryEntity> = {
    id: 'test-id',
    title: 'testcategory',
    slug: 'test-category',
  };
  beforeEach(async () => {
    mockCategoryRepository = mock<Repository<CategoryEntity>>();
    mockS3service = mock<S3Service>();
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: S3Service,
          useValue: mockS3service,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();
    service = module.get(CategoryService);
  });
  it('should be defined!', () => {
    expect(service).toBeDefined();
  });

  describe('Create', () => {
    const createCategoryDto: CreateCategoryDto = {
      title: 'new',
      description: 'new',
      parentId: 'parent-id',
      icon: {
        buffer: Buffer.from(''),
        size: 2344,
        mimetype: 'image/png',
      } as Express.Multer.File,
    };
    it('should create category successfully with icon and parent', async () => {
      mockCategoryRepository.findOne.mockResolvedValueOnce({
        id: 'parent-id',
      } as CategoryEntity);
      mockCategoryRepository.findOne.mockResolvedValueOnce(null);
      mockS3service.upload.mockResolvedValue({ Url: 'url', Key: 'key' });
      mockCategoryRepository.create.mockReturnValue({ icon: {} } as any);
      mockCategoryRepository.save.mockResolvedValue({
        id: 'saved-id',
      } as CategoryEntity);

      const result = await service.create(createCategoryDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({where:{id:'parent-id'}})
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({where:{title:createCategoryDto.title}});
      expect(mockS3service.upload).toHaveBeenCalledWith(createCategoryDto.icon,'category');
      expect(mockCategoryRepository.save).toHaveBeenCalled();
      expect(result).toEqual({message:PublicMessage.Created})

    });
    it('should throw NotfoundException if parent not found',async()=>{
      mockCategoryRepository.findOne.mockResolvedValueOnce(null)
      await expect(service.create(createCategoryDto)).rejects.toThrow(NotFoundException);
    });
    it('should throw ConflictException if title already exists', async () => {
      mockCategoryRepository.findOne.mockResolvedValueOnce({ id: 'parent-id' } as CategoryEntity); // parent exists
      mockCategoryRepository.findOne.mockResolvedValueOnce({ title: 'New Category' } as CategoryEntity); // duplicate title
  
      await expect(service.create(createCategoryDto)).rejects.toThrow(ConflictException);
    });
    it('should create category without icon if icon not provided', async () => {
      const dtoWithoutIcon = { ...createCategoryDto, icon: undefined };
  
      mockCategoryRepository.findOne.mockResolvedValueOnce({ id: 'parent-id' } as CategoryEntity); // parent
      mockCategoryRepository.findOne.mockResolvedValueOnce(null); // no duplicate
      mockCategoryRepository.create.mockReturnValue({ icon: {} } as any);
      mockCategoryRepository.save.mockResolvedValue({ id: 'saved-id' } as CategoryEntity);
  
      const result = await service.create(dtoWithoutIcon as any);
      expect(mockS3service.upload).not.toHaveBeenCalled();
      expect(result).toEqual({ message: PublicMessage.Created });
    });
  });
  describe('listCategories',()=>{
    const baseCategories = [
      { id: '1', title: 'A', slug: 'a', created_at: new Date() },
      { id: '2', title: 'B', slug: 'b', created_at: new Date() },
    ];
    it('should return top-level categories when slug is not provided',async()=>{
      mockCategoryRepository.find.mockResolvedValue(baseCategories as CategoryEntity[]);
      const result=await service.listCategories();

      expect(mockCategoryRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { parentId: IsNull() },
        cache: true,
        select: expect.any(Object),
        order: { created_at: 'ASC' },
      }));
      expect(result).toEqual({
        currentCategory: null,
        categories: baseCategories,
        options: [],
        showBack: false,
      }); 
    });
    it('should return subcategories when valid slug is provided', async () => {
      const mockParent = {
        id: 'parent-id',
        slug: 'electronics',
        formFields: [{ type: 'select', name: 'brand' }],
      } as CategoryEntity;
  
      mockCategoryRepository.findOne.mockResolvedValue(mockParent);
      mockCategoryRepository.find.mockResolvedValue(baseCategories as CategoryEntity[]);
  
      const result = await service.listCategories('electronics');
  
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
        cache: true,
      });
  
      expect(mockCategoryRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { parentId: mockParent.id },
      }));
  
      expect(result).toEqual({
        currentCategory: mockParent,
        categories: baseCategories,
        options: mockParent.formFields,
        showBack: true,
      });
    });
    it('should throw NotFoundException if slug not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);
  
      await expect(service.listCategories('unknown-slug')).rejects.toThrow(NotFoundException);
    });
    it('should return empty options if no formFields exist', async () => {
      const mockParent = {
        id: 'parent-id',
        slug: 'furniture',
        formFields: [],
      } as any;
  
      mockCategoryRepository.findOne.mockResolvedValue(mockParent);
      mockCategoryRepository.find.mockResolvedValue([]);
  
      const result = await service.listCategories('furniture');
  
      expect(result.options).toEqual([]); 
  })
  })
});
