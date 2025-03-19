import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  minSize?: number; // in bytes
  allowedExtensions?: string[];
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly minSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly allowedExtensions: string[];
  private readonly required: boolean;

  constructor(options: FileValidationOptions = {}) {
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // Default 5MB
    this.minSize = options.minSize || 0;
    this.allowedMimeTypes = options.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    this.allowedExtensions = options.allowedExtensions || [
      '.jpg', 
      '.jpeg', 
      '.png', 
      '.gif', 
      '.webp', 
      '.svg'
    ];
    this.required = options.required || false;
  }

  transform(file: Express.Multer.File | undefined) {
    // Check if file is required but not provided
    if (this.required && !file) {
      throw new BadRequestException('فایل الزامی است');
    }

    // If no file is provided and not required, return undefined
    if (!file) {
      return undefined;
    }
    
    // Validate file size
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `حجم فایل نباید بیشتر از ${Math.round(this.maxSize / 1024 / 1024)} مگابایت باشد`
      );
    }

    if (file.size < this.minSize) {
      throw new BadRequestException(
        `حجم فایل نباید کمتر از ${Math.round(this.minSize / 1024)} کیلوبایت باشد`
      );
    }

    // Validate MIME type
    if (
      this.allowedMimeTypes.length > 0 &&
      !this.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `نوع فایل نامعتبر است. فرمت‌های مجاز: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    // Validate file extension
    const fileExtension = this.getExtension(file.originalname);
    if (
      this.allowedExtensions.length > 0 &&
      !this.allowedExtensions.includes(fileExtension.toLowerCase())
    ) {
      throw new BadRequestException(
        `پسوند فایل نامعتبر است. پسوندهای مجاز: ${this.allowedExtensions.join(', ')}`
      );
    }

    return file;
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }
} 