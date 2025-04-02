import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import SwaggerConfig from 'src/configs/swagger.config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';

import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

export default function AppInit(app: NestExpressApplication) {
  // Enable security headers with helmet
  app.use(helmet());

  // Enable CORS with secure configuration
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  });

  // Body parsers and cookie middleware
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  app.use(compression());


  // Global pipes and interceptors
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    // forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }));
  // API prefix and documentation
  app.setGlobalPrefix('api');
  SwaggerConfig(app);

  // Logger service
  // const logger = new LoggerService();
  // app.useLogger(logger);
}
