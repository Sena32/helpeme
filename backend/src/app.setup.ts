import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export const API_PREFIX = 'api';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
}
