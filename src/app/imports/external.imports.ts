import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createKeyv } from '@keyv/redis';
import { TypeOrmDbConfig } from 'src/configs/typeOrrm.config';
import { BullModule } from '@nestjs/bull';

/**
 * External module imports configuration for the application
 * Includes configuration for environment variables, caching, and database
 */
export const appExternalImports = [
  // Load environment variables from .env file
  ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
  }),

  // Configure Redis cache
  CacheModule.registerAsync({
    isGlobal: true,
    useFactory: async () => ({
      max: 100, // Maximum number of items in cache
      stores: [
        createKeyv(
          `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        ),
      ],
    }),
  }),


  // Configure TypeORM database connection
  TypeOrmModule.forRootAsync({
    useClass: TypeOrmDbConfig,
    inject: [TypeOrmDbConfig],
  }),
];
