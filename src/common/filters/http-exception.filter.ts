import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    
    let responseBody: any = exception.getResponse();
    
    // If the exception response is a string, convert it to our standard format
    if (typeof responseBody === 'string') {
      responseBody = {
        statusCode: status,
        message: responseBody,
        error: HttpStatus[status],
        timestamp: new Date().toISOString(),
      };
    }
    
    // Add path to the response if it's not already there
    if (!responseBody.path) {
      responseBody.path = request.url;
    }
    
  
    response.status(status).json(responseBody);
  }
} 