import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { S3Service } from 'src/app/plugins/s3.service';
import { CategoryService } from '../../category/category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { CreatePostDto } from '../dtos/post.dto';
import { CategoryEntity } from '../../category/entities/category.entity';
import { NotFoundMessages, PublicMessage } from 'src/common/enums';
import { ConflictException, NotFoundException } from '@nestjs/common';
const createPostDtoFactory = (
  overrides: Partial<CreatePostDto> = {},
): CreatePostDto => ({
  title: 'Test Post',
  description: 'This is a test post',
  categoryId: 'category-123',
  options: { price: 100 },
  city: 'Tehran',
  province: 'Tehran',
  allowChatMessages: true,
  location: { lat: 3, lng: 4 },
  ...overrides,
});
describe('PostService', () => {
  let service: PostService;
  let postRepository: MockProxy<Repository<PostEntity>>;
  let dataSource: MockProxy<DataSource>;
  let manager: MockProxy<EntityManager>;
  let s3Service: MockProxy<S3Service>;
  let categoryService: MockProxy<CategoryService>;
  let mockRequest: { user: { id: string } };
  beforeEach(async () => {
    postRepository = mock<Repository<PostEntity>>();
    dataSource = mock<DataSource>();
    manager = mock<EntityManager>();
    s3Service = mock<S3Service>();
    categoryService = mock<CategoryService>();
    mockRequest = { user: { id: 'user-123' } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: getRepositoryToken(PostEntity), useValue: postRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: S3Service, useValue: s3Service },
        { provide: CategoryService, useValue: categoryService },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();
    service = await module.resolve<PostService>(PostService);
  });
  afterEach(() => {
    jest.clearAllMocks(); // Ensure mocks are reset between tests
  });

  describe('createPost', () => {
    const createPostDto = createPostDtoFactory();
    const mockCategory = {
      id: 'category-123',
      formFields: [
        { name: 'price', type: 'number', required: true, label: 'Price' },
      ],
    };

    it('should successfully create a post without media files', async () => {
      // arrange
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));
      manager.findOne.mockResolvedValue(null);
      categoryService.findOne.mockResolvedValue(mockCategory as CategoryEntity);
      manager.create.mockReturnValue({ id: 'post123' } as any);
      manager.save.mockResolvedValue({ id: 'post123' } as any);
      // Act
      const result = await service.createPost(createPostDto, []);
      // Assert
      expect(manager.findOne).toHaveBeenCalledWith(PostEntity, {
        where: { title: createPostDto.title, userId: mockRequest.user.id },
      });
      expect(categoryService.findOne).toHaveBeenCalledWith(
        createPostDto.categoryId,
      );
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(manager.create).toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalled();
      expect(result.message).toEqual(PublicMessage.Created_Post);
    });
    it('should create a post with media files', async () => {
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));
      manager.findOne.mockResolvedValue(null);
      categoryService.findOne.mockResolvedValue(mockCategory as CategoryEntity);
      s3Service.upload.mockResolvedValue({ Url: 's3-url', Key: 's3-key' });
      const mockFile: Express.Multer.File = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;
      manager.create.mockImplementation((_, data) => data);
      manager.save.mockResolvedValue({ id: 'posy-with-files' } as any);

      const result = await service.createPost(createPostDto, [mockFile]);
      expect(result).toEqual({ message: PublicMessage.Created_Post });
      expect(manager.findOne).toHaveBeenCalledWith(PostEntity, {
        where: {
          title: createPostDto.title,
          userId: mockRequest.user.id,
        },
      });
      expect(manager.save).toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalled();
    });
    it('should throw conflictException if post with same title exists', async () => {
      dataSource.transaction.mockImplementation((cb) => cb(manager));
      manager.findOne.mockResolvedValue({ id: 'exist-post' });
      await expect(service.createPost(createPostDto, [])).rejects.toThrow(
        ConflictException,
      );
      expect(manager.findOne).toHaveBeenCalledWith(PostEntity, {
        where: { title: createPostDto.title, userId: mockRequest.user.id },
      });
      expect(manager.save).not.toHaveBeenCalled();
    });
    it('🚫 should throw NotFoundException if category not found', async () => {
      // Arrange
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));
      manager.findOne.mockResolvedValue(null);
      categoryService.findOne.mockImplementation(() => {
        throw new NotFoundException(NotFoundMessages.Category);
      });
    
      // Act
      await expect(service.createPost(createPostDto, [])).rejects.toThrow(NotFoundException);
      
      // Assert
      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
      expect(categoryService.findOne).toHaveBeenCalledWith(createPostDto.categoryId);
    });
  });
});
