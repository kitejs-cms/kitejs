import { Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

export async function validationSetup(app: INestApplication): Promise<void> {
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      validateCustomDecorators: true,
    })
  );
}
