import { HttpException, HttpStatus } from '@nestjs/common';

export interface IBaseExceptionResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
}

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    error: string = 'Internal Server Error',
  ) {
    const response: IBaseExceptionResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
    super(response, statusCode);
  }
} 