import { HttpStatus } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import { ArgumentsHost, Catch } from "@nestjs/common";
import { ExceptionFilter } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Get status code and message
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Base response with essential info
    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message || 'Internal server error',
    };
    
    // In development, add stack trace and detailed error
    if (isDevelopment &&  !(exception instanceof HttpException)) {
      Object.assign(responseBody, {
        stack: exception.stack,
        name: exception.name,
      });
      
      // Log the full error to console in development
      console.error('Exception caught:', exception);
    } else {
      // In production, hide internal server error details
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        responseBody.message = 'Internal server error';
      }
    }
    
    response.status(status).json(responseBody);
  }
} 
