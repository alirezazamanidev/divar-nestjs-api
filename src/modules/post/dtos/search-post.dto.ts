import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { escape } from 'html-escaper';

// Enum for sorting options
export enum SortByEnum {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  CHEAPEST = 'cheapest',
  EXPENSIVE = 'expensive',
}

// Price range interface
export class PriceRangeDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  min?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  max?: number;
}

// ترکیب کردن PostFiltersDto و PaginationDto
export class SearchPostDto  {
  @ApiProperty({
    description: 'Search term for filtering posts',
    example: 'apartment',
    required: false
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return escape(value.trim());
    }
    return value;
  })
  search?: string;

  @ApiProperty({
    description: 'Slug of the category to search in',
    example: 'real-estate',
    required: false
  })
  @IsString()
  @IsOptional()
  categorySlug?: string;

  @ApiProperty({
    description: 'City to filter posts',
    example: 'تهران',
    required: false
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Province to filter posts',
    example: 'تهران',
    required: false
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    description: 'Custom filtering options based on category form fields',
    required: false,
    example: { price: { min: 1000000, max: 5000000 }, rooms: 2 }
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
  
  @ApiProperty({
    description: 'Sort results by specific criteria',
    enum: SortByEnum,
    default: SortByEnum.NEWEST,
    required: false
  })
  @IsEnum(SortByEnum)
  @IsOptional()
  sortBy?: SortByEnum;
  
  @ApiProperty({
    description: 'Filter by price range',
    type: PriceRangeDto,
    required: false,
    example: { min: 1000000, max: 5000000 }
  })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  priceRange?: PriceRangeDto;
  

  @ApiProperty({
    description: 'Only show posts with chat enabled',
    type: Boolean,
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  chat?: boolean;
  
  @ApiProperty({
    description: 'Only show posts with images',
    type: Boolean,
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasImage?: boolean;
} 