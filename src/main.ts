import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import AppInit from './app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  

  AppInit(app)
  const PORT = process.env.APP_PORT ?? 4000;
  await app.listen(PORT, () => {
    console.log(`api run => http://${process.env.APP_HOST}:${PORT}/api`);
    console.log(`swagger run => http://${process.env.APP_HOST}:${PORT}/doc`);
  });
}
bootstrap();
