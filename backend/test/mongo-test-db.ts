import { randomUUID } from 'node:crypto';

export function isolatedDatabaseName(): string {
  return `test-${randomUUID()}`;
}
