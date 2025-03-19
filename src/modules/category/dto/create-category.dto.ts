import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'عنوان دسته‌بندی - اجباری و حداکثر 100 کاراکتر',
    example: 'Electronics',
    required: true,
  })
  @IsNotEmpty({ message: 'عنوان دسته‌بندی الزامی است' })
  @IsString({ message: 'عنوان دسته‌بندی باید متن باشد' })
  @MaxLength(100, { message: 'عنوان دسته‌بندی نباید بیشتر از 100 کاراکتر باشد' })
  title: string;

  @ApiProperty({
    description: 'توضیحات دسته‌بندی - اختیاری و حداکثر 500 کاراکتر',
    example: 'All electronic devices and accessories',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'توضیحات دسته‌بندی باید متن باشد' })
  @MaxLength(500, { message: 'توضیحات دسته‌بندی نباید بیشتر از 500 کاراکتر باشد' })
  description?: string;

  @ApiProperty({
    description: 'شناسه دسته‌بندی والد - اختیاری و باید یک UUID معتبر باشد',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسه دسته‌بندی والد نامعتبر است' })
  parentId?: string;

  @ApiProperty({
    description: 'آیکون دسته‌بندی - اختیاری، فایل تصویر',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  icon?: Express.Multer.File;

}