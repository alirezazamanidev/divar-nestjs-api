import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string | object,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status);
  }
}

export class BadRequestException extends AppException {
  constructor(message: string | object = 'Bad Request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string | object = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string | object = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string | object = 'Not Found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends AppException {
  constructor(message: string | object = 'Conflict') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class ValidationException extends AppException {
  constructor(message: string | object = 'Validation Failed') {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class DatabaseException extends AppException {
  constructor(message: string | object = 'Database Error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ServiceUnavailableException extends AppException {
  constructor(message: string | object = 'Service Unavailable') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
} 