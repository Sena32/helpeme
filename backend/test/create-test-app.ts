import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

// AppModule is imported lazily so suites can tweak process.env before ConfigModule validates it.
export async function createTestingModuleWith(): Promise<TestingModule> {
  const { AppModule } = await import('../src/app.module');
  return Test.createTestingModule({ imports: [AppModule] }).compile();
}

export async function createTestApp(): Promise<INestApplication<App>> {
  const { configureApp } = await import('../src/app.setup');
  const moduleRef = await createTestingModuleWith();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}
