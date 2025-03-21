import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { FormFieldDto } from './form-field.dto';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'عنوان دسته بندی',
    example: 'لوازم الکترونیکی',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'توضیحات دسته بندی',
    example: 'شامل انواع لوازم الکترونیکی مانند موبایل، لپ تاپ و...',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'شناسه دسته بندی والد',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'آیکون دسته بندی',
    required: false,
  })
  @IsOptional()
  icon?: Express.Multer.File;

  @ApiProperty({
    description: 'فیلدهای فرم مربوط به دسته‌بندی - آرایه‌ای از فیلدهای فرم',
    type: [FormFieldDto],
    example: [
      {
        name: 'area',
        type: 'number',
        label: 'متراژ',
        required: true,
        validation: {
          min: 30,
          max: 500,
        },
      },
      {
        name: 'floor',
        type: 'number',
        label: 'طبقه',
        required: true,
        validation: {
          min: -2,
          max: 100,
        },
      },
      {
        name: 'totalFloors',
        type: 'number',
        label: 'تعداد کل طبقات',
        required: true,
        validation: {
          min: 1,
          max: 100,
        },
      },
      {
        name: 'rooms',
        type: 'number',
        label: 'تعداد اتاق',
        required: true,
        validation: {
          min: 0,
          max: 5,
        },
      },
      {
        name: 'parking',
        type: 'checkbox',
        label: 'پارکینگ دارد',
        required: false,
      },
      {
        name: 'elevator',
        type: 'checkbox',
        label: 'آسانسور دارد',
        required: false,
      },
      {
        name: 'storage',
        type: 'checkbox',
        label: 'انباری دارد',
        required: false,
      },
      {
        name: 'buildingAge',
        type: 'number',
        label: 'سن ساختمان',
        required: true,
        validation: {
          min: 0,
          max: 100,
        },
      },
    ],
  })
  @Type(() => FormFieldDto)
  @IsOptional()
  formFields?: FormFieldDto[];
}
