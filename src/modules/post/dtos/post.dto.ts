import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsBoolean,
  ValidateNested,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiProperty({ description: 'عرض جغرافیایی', example: 35.6892 })
  @IsLatitude()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ description: 'طول جغرافیایی', example: 51.3890 })
  @IsLongitude()
  @IsNotEmpty()
  lng: number;
}

export class CreatePostDto {
  @ApiProperty({
    description: 'شناسه دسته‌بندی پست',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'شناسه دسته‌بندی باید یک UUID معتبر باشد' })
  @IsNotEmpty({ message: 'شناسه دسته‌بندی نمی‌تواند خالی باشد' })
  categoryId: string;

  @ApiProperty({
    description: 'شهر',
    example: 'تهران',
  })
  @IsString({ message: 'شهر باید رشته باشد' })
  @IsNotEmpty({ message: 'شهر نمی‌تواند خالی باشد' })
  @MaxLength(100, { message: 'شهر نمی‌تواند بیشتر از 100 کاراکتر باشد' })
  city: string;

  @ApiProperty({
    description: 'استان',
    example: 'تهران',
  })
  @IsString({ message: 'استان باید رشته باشد' })
  @IsNotEmpty({ message: 'استان نمی‌تواند خالی باشد' })
  @MaxLength(100, { message: 'استان نمی‌تواند بیشتر از 100 کاراکتر باشد' })
  province: string;

  @ApiProperty({
    description: 'اجازه پیام‌های چت',
    example: true,
  })
  @IsBoolean({ message: 'اجازه پیام‌های چت باید یک مقدار بولین باشد' })
  @IsNotEmpty({ message: 'اجازه پیام‌های چت نمی‌تواند خالی باشد' })
  allowChatMessages: boolean;

  @ApiProperty({
    description: 'موقعیت جغرافیایی',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'موقعیت جغرافیایی نمی‌تواند خالی باشد' })
  location: LocationDto;

  @ApiProperty({
    description: 'عنوان پست',
    example: 'پست جدید من',
  })
  @IsString({ message: 'عنوان باید رشته باشد' })
  @IsNotEmpty({ message: 'عنوان نمی‌تواند خالی باشد' })
  @MaxLength(255, { message: 'عنوان نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  title: string;

  @ApiProperty({
    description: 'توضیحات پست',
    example: 'این یک توضیح مفصل برای پست جدید من است.',
  })
  @IsString({ message: 'توضیحات باید رشته باشد' })
  @IsNotEmpty({ message: 'توضیحات نمی‌تواند خالی باشد' })
  description: string;

  @ApiProperty({
    description: 'داده‌های فرم مرتبط با پست',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  @IsObject({ message: 'داده‌های فرم باید یک آبجکت باشد' })
  @IsNotEmpty({ message: 'داده‌های فرم نمی‌تواند خالی باشد' })
  options: Record<string, any>;

  @ApiProperty({
    description: 'عکس‌های پیوست شده به پست (حداکثر ۵ عکس)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  @IsOptional()
  images?: Express.Multer.File[];

  @ApiProperty({
    description: 'ویدیوهای پیوست شده به پست (حداکثر ۲ ویدیو)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  @IsOptional()
  videos?: Express.Multer.File[];
}
