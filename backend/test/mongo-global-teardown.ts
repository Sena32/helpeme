export default async function stopInMemoryMongo(): Promise<void> {
  await globalThis.mongoMemoryServer?.stop();
}
