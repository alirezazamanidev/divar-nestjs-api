import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { transform } from 'typescript';


export class CreatePostDto {
  @ApiProperty({
    description: 'شناسه دسته‌بندی پست',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'عنوان پست',
    example: 'پست جدید من'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'توضیحات پست',
    example: 'این یک توضیح مفصل برای پست جدید من است.'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'داده‌های فرم مرتبط با پست'
  })

  @Transform(({value})=>{

    if(typeof value ==='string'){
      return JSON.parse(value);
    }
    return value;
  })
  @IsObject()
  @IsNotEmpty()
  formData: Record<string, any>;
  
  @ApiProperty({
    description: 'عکس‌های پیوست شده به پست (حداکثر ۵ عکس)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary'
    },
    required: false
  })
  @IsOptional()
  images?: Express.Multer.File[];
  
  @ApiProperty({
    description: 'ویدیوهای پیوست شده به پست (حداکثر ۲ ویدیو)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary'
    },
    required: false
  })
  @IsOptional()
  videos?: Express.Multer.File[];
}