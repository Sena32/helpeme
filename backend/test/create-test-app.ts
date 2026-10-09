import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';

export async function createTestApp(): Promise<INestApplication<App>> {
  // Imported lazily so suites can tweak process.env before ConfigModule validates it.
  const { AppModule } = await import('../src/app.module');
  const { configureApp } = await import('../src/app.setup');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}
