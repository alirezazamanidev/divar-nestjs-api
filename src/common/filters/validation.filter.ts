import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;
    
    // Check if this is a validation error
    if (exceptionResponse && exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      const formattedErrors = this.formatErrors(exceptionResponse.message);
      
      return response.status(status).json({
        statusCode: status,
        message: 'Validation failed',
        errors: formattedErrors,
        requiredFields: this.extractRequiredFields(formattedErrors),
      });
    }
    
    // If it's not a validation error, return the original error
    return response.status(status).json(exceptionResponse);
  }
  
  private formatErrors(errors: ValidationError[] | string[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};
    
    // If these are just string messages
    if (typeof errors[0] === 'string') {
      formattedErrors['general'] = errors as string[];
      return formattedErrors;
    }
    
    // If these are ValidationError objects
    (errors as ValidationError[]).forEach((error) => {
      if (!formattedErrors[error.property]) {
        formattedErrors[error.property] = [];
      }
      
      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          formattedErrors[error.property].push(constraint);
        });
      }
      
      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        Object.keys(nestedErrors).forEach((key) => {
          const nestedKey = `${error.property}.${key}`;
          formattedErrors[nestedKey] = nestedErrors[key];
        });
      }
    });
    
    return formattedErrors;
  }
  
  private extractRequiredFields(errors: Record<string, string[]>): string[] {
    const requiredFields: string[] = [];
    
    Object.keys(errors).forEach((field) => {
      errors[field].forEach((error) => {
        if (error.includes('required') || error.includes('should not be empty')) {
          requiredFields.push(field);
        }
      });
    });
    
    return [...new Set(requiredFields)]; // Remove duplicates
  }
} 