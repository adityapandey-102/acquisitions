import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon based on environment
if (process.env.NODE_ENV === 'development') {
  // Configuration for Neon Local (development)
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
} else {
  // Configuration for Neon Cloud (production)
  // Use default Neon cloud settings
  neonConfig.useSecureWebSocket = true;
  neonConfig.poolQueryViaFetch = true;
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL environment variable is required. ` +
      `Current environment: ${process.env.NODE_ENV || 'unknown'}`
  );
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, {
  logger: process.env.NODE_ENV === 'development',
});

// Health check function for the database connection
export async function healthCheck() {
  try {
    await sql`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

export { db, sql };
