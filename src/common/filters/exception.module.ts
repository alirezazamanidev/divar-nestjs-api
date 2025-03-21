import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpExceptionFilter } from './http-exception.filter';
import { applyFilters } from 'typeorm-extension';
import { ValidationExceptionFilter } from './validation.filter';
@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide:APP_FILTER,
      useClass:ValidationExceptionFilter
    }
  ],
})
export class ExceptionModule {}
