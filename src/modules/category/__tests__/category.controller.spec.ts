import { mock, MockProxy } from 'jest-mock-extended';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { Test } from '@nestjs/testing';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { PublicMessage } from 'src/common/enums';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: MockProxy<CategoryService>;

  beforeEach(async () => {
    service = mock<CategoryService>();
    const module =await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: service,
        },
      ]
    }).compile()
    controller=module.get(CategoryController)
  });
  it('should be defiend',()=>{
    expect(controller).toBeDefined()
  });


  describe('create',()=>{
    it('should call service.create with DTO and file', async () => {
        const dto: CreateCategoryDto = {
          title: 'test',
          description: '',
          formFields: [],
        };
  
        const file = {
          originalname: 'icon.png',
          size: 1234,
          mimetype: 'image/png',
        } as Express.Multer.File;
  
        const result = { message: PublicMessage.Created };
        service.create.mockResolvedValue(result as any);
  
        const response = await controller.create(dto, file);
  
        expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
          ...dto,
          icon: file,
        }));
  
        expect(response).toEqual(result);
      });
    
      it('should call service.create without file if not provided', async () => {
        const dto: CreateCategoryDto = {
          title: 'no-icon',
          description: '',
          formFields: [],
        };
  
        service.create.mockResolvedValue({ message: PublicMessage.Created } as any);
  
        const res = await controller.create(dto);
  
        expect(service.create).toHaveBeenCalledWith(dto);
    
    });
  });
  describe('listCategories', () => {
    it('should call service.listCategories with slug', async () => {
      const slug = 'electronics';
      const result = { categories: [] };

      service.listCategories.mockResolvedValue(result as any);

      const response = await controller.listCategories(slug);

      expect(service.listCategories).toHaveBeenCalledWith(slug);
      expect(response).toBe(result);
    });

    it('should call service.listCategories with undefined slug', async () => {
      const result = { categories: [] };
      service.listCategories.mockResolvedValue(result as any);

      const response = await controller.listCategories('');

      expect(service.listCategories).toHaveBeenCalled()
      expect(response).toBe(result);
    });
  });
});
