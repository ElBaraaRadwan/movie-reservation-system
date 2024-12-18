import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { hostname } from 'os';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());
  await app.listen(3000);
  console.log(`Application is running on: http://${hostname}:3000`);
}
bootstrap();
