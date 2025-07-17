import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unrecognized properties
      forbidNonWhitelisted: true, // Throw if unknown props exist
      transform: true, // This is the key: enables type transformation
      transformOptions: {
        enableImplicitConversion: true, // Allows conversion from string to number etc.
      },
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
