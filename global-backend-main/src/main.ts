import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './helpers/error.filter';
import { WsAdapter } from '@nestjs/platform-ws';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  //@ts-expect-error
  app.useBodyParser('json', { limit: '20mb' });
  app.enableCors({
    origin: '*',
    allowedHeaders: '*',
    methods: '*',
  });
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true, // all fields not covered in decorators will be removed from body parameter
      forbidNonWhitelisted: true, // all fields in body that are not whitelisted are banned.
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(3000);
}

bootstrap();
