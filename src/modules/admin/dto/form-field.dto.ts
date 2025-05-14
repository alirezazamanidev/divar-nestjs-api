import { IsString, IsBoolean, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidationRuleDto {
  @IsOptional()
  min?: number;

  @IsOptional()
  max?: number;

  @IsOptional()
  @IsString()
  pattern?: string;
}

export class FormFieldDto {
  @IsString()
  name: string;
  
  @IsString()
  type: string; // 'text', 'number', 'select', 'checkbox', etc.
  
  @IsString()
  label: string;
  
  @IsBoolean()
  required: boolean;
  
  @IsOptional()
  @IsArray()
  options?: string[]; // For select fields
  
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ValidationRuleDto)
  validation?: ValidationRuleDto;
} 