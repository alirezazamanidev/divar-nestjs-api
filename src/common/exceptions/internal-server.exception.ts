import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InternalServerException extends BaseException {
  constructor(message: string = 'Internal server error occurred') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
} 