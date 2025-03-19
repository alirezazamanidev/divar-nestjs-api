import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsInt, 
  Min, 
  Max, 
  IsArray, 
  ArrayMaxSize 
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;
}

export class MultipleFilesUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: false })
  files?: any[];
}

export class FileValidationDto {
  @ApiProperty({ 
    description: 'Maximum file size in bytes', 
    required: false,
    default: 2 * 1024 * 1024 // 2MB
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  @Type(() => Number)
  maxSize?: number;

  @ApiProperty({ 
    description: 'Allowed MIME types for the file', 
    required: false,
    example: ['image/jpeg', 'image/png']
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @Transform(({ value }) => 
    typeof value === 'string' ? value.split(',') : value
  )
  allowedMimeTypes?: string[];

  @ApiProperty({ 
    description: 'Allowed file extensions', 
    required: false,
    example: ['.jpg', '.png']
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @Transform(({ value }) => 
    typeof value === 'string' ? value.split(',') : value
  )
  allowedExtensions?: string[];
} 