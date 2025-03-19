import { FileFieldsInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { MulterField } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { memoryStorage } from "multer";
import { BadRequestException } from "@nestjs/common";

// Define common file types
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// File validation options
export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  maxCount?: number;
}

// Default options for common file types
export const DEFAULT_IMAGE_OPTIONS: FileValidationOptions = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: IMAGE_MIME_TYPES,
};

export const DEFAULT_DOCUMENT_OPTIONS: FileValidationOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: DOCUMENT_MIME_TYPES,
};

// Helper for file validation
export const fileFilter = (options: FileValidationOptions = DEFAULT_IMAGE_OPTIONS) => {
  return (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    // Validate MIME type
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(`نوع فایل نامعتبر است. فرمت‌های مجاز: ${options.allowedMimeTypes.join(', ')}`),
        false
      );
    }

    callback(null, true);
  };
};

// Main upload interceptor with validation
export function UploadFileS3(
  fieldName: string, 
  options: FileValidationOptions = DEFAULT_IMAGE_OPTIONS
) {
  return FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: {
      fileSize: options.maxSize,
    },
    fileFilter: fileFilter(options),
  });
}

// Multiple fields upload interceptor with validation
export function UploadFileFieildsS3(
  uploadFields: MulterField[],
  options: FileValidationOptions = DEFAULT_IMAGE_OPTIONS
) {
  return FileFieldsInterceptor(uploadFields, {
    storage: memoryStorage(),
    limits: {
      fileSize: options.maxSize,
    },
    fileFilter: fileFilter(options),
  });
}