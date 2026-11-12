import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/schemas/index.ts'
});
