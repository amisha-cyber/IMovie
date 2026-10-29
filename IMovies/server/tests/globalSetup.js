import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uriFile = path.resolve(__dirname, '../.test-mongo-uri');

let mongodInstance = null;

export async function setup() {
  process.env.NODE_ENV = 'test';
  
  mongodInstance = await MongoMemoryServer.create();
  const uri = mongodInstance.getUri();
  
  process.env.TEST_MONGODB_URI = uri;
  fs.writeFileSync(uriFile, uri, 'utf-8');

  return async () => {
    if (fs.existsSync(uriFile)) {
      try {
        fs.unlinkSync(uriFile);
      } catch (e) {
        // ignore file unlink failure
      }
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
  };
}

export async function teardown() {
  if (fs.existsSync(uriFile)) {
    try {
      fs.unlinkSync(uriFile);
    } catch (e) {
      // ignore
    }
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
}
