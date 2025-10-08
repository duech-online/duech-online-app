import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL;

const pool = connectionString
  ? // Production: Use connection string from Supabase
    new Pool({
      connectionString,
      ssl: process.env.SUPABASE_CA_CERT
        ? {
            ca: process.env.SUPABASE_CA_CERT.replace(/\\n/g, '\n'),
            rejectUnauthorized: true,
          }
        : {
            rejectUnauthorized: false,
          },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host: 'localhost',
      port: 5433,
      database: 'duech',
      user: 'duech',
      password: 'OrdenyProgreso123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

export const db = drizzle(pool, { schema });

export { pool };
