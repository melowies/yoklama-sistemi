// src/database/db.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASS || 'postgres',
  database: process.env.PG_DB || 'yoklama_sistemi',
});

export default pool;