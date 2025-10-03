import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Support both connection string (production/Supabase) and individual params (local dev)
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

const pool = connectionString
  ? // Production: Use connection string from Supabase
    new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Accept Supabase's SSL certificates
      },
      // Optimized for serverless/Supabase
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : // Local development: Use individual parameters
    new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'duech',
      user: process.env.POSTGRES_USER || 'duech',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

// Error handling for idle connections
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for raw queries if needed
export { pool };
