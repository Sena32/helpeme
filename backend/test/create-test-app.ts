import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Writable } from 'node:stream';
import { App } from 'supertest/types';

export interface TestAppOptions {
  logDestination?: Writable;
}

// AppModule is imported lazily so suites can tweak process.env before ConfigModule validates it.
export async function createTestingModuleWith(
  options: TestAppOptions = {},
): Promise<TestingModule> {
  const { AppModule } = await import('../src/app.module');
  const { LOG_DESTINATION } = await import('../src/common/logging/log-destination');
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.logDestination) {
    builder.overrideProvider(LOG_DESTINATION).useValue(options.logDestination);
  }
  return builder.compile();
}

export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication<App>> {
  const { configureApp } = await import('../src/app.setup');
  const moduleRef = await createTestingModuleWith(options);
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}
