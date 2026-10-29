import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: [path.resolve(__dirname, './tests/globalSetup.js')],
    testTimeout: 20000,
    hookTimeout: 20000
  }
});
