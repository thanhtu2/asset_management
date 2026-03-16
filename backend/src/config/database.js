import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc đúng file .env từ thư mục gốc của dự án (lùi 3 cấp thư mục)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// First connection without database to create it
const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456'
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'asset_management'}`);
    console.log('Database created or already exists!');
    
    // Read and execute init.sql
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    await connection.query(`USE ${process.env.DB_NAME || 'asset_management'}`);
    
    // Split by semicolon and execute each statement
    const statements = initSql.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (e) {
          // Ignore errors for CREATE DATABASE and USE statements
          if (!e.message.includes('Unknown database') && !e.message.includes('Already exists')) {
            console.log('Statement executed:', statement.substring(0, 50) + '...');
          }
        }
      }
    }
    
    console.log('Database tables initialized!');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database setup failed:', error.message);
    return false;
  }
};

// Create pool after database is created
let pool = null;

export const initDatabase = async () => {
  await createDatabase();
  
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'asset_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4_unicode_ci'
  });
  
  return pool;
};

// Get pool - ensures pool is initialized
export const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
};

// Test database connection
export const testConnection = async () => {
  if (!pool) {
    await initDatabase();
  }
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Export default as a proxy that always gets the current pool
const poolProxy = new Proxy({}, {
  get: (target, prop) => {
    if (!pool) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool[prop];
  }
});

export default poolProxy;
