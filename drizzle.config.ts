import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load .env.local (Drizzle-kit tidak auto-load env files)
config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
