/**
 * BIKAN NeonDB Client
 * ───────────────────
 * Serverless PostgreSQL connection via @neondatabase/serverless
 * Optimized for Vercel Edge/Serverless Functions
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create neon SQL client (HTTP-based, no persistent connection needed)
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle ORM instance with full schema
export const db = drizzle(sql, { schema });
