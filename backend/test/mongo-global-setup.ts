import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var mongoMemoryServer: MongoMemoryServer | undefined;
}

export default async function startInMemoryMongo(): Promise<void> {
  globalThis.mongoMemoryServer = await MongoMemoryServer.create();
  process.env.TEST_MONGODB_URI = globalThis.mongoMemoryServer.getUri();
}
