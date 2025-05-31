import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Running database migrations...");
    
    // Create sessions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `);

    // Create users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create admin_credentials table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        two_fa_secret VARCHAR,
        is_two_fa_enabled BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create campaigns table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR NOT NULL,
        funding_model VARCHAR NOT NULL,
        target_amount VARCHAR NOT NULL,
        current_amount VARCHAR DEFAULT '0',
        deadline TIMESTAMP,
        status VARCHAR DEFAULT 'pending',
        featured BOOLEAN DEFAULT FALSE,
        image_url VARCHAR,
        creator_id VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (creator_id) REFERENCES users(id)
      );
    `);

    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
