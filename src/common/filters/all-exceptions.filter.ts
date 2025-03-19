import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If it's an HTTP exception, let the HTTP exception filter handle it
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody: any = exception.getResponse();

      // Add path to the response if it's not already there
      if (typeof responseBody === 'object' && !responseBody.path) {
        responseBody.path = request.url;
      }

      this.logger.error(`${request.method} ${request.url} - ${status}`);

      return response.status(status).json(responseBody);
    }

    // For non-HTTP exceptions, convert to InternalServerException
    const internalException = new InternalServerErrorException(
      exception instanceof Error
        ? exception.message
        : 'An unexpected error occurred',
    );

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody: any = internalException.getResponse();
    responseBody.path = request.url;

    // Log the error with stack trace if available
    this.logger.error(
      `${request.method} ${request.url} - ${status} - Unhandled exception`,
    );

    response.status(status).json(responseBody);
  }
}
