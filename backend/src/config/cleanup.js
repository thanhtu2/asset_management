import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const cleanup = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'asset_management'
    });

    // Delete admin user
    await connection.query('DELETE FROM users WHERE username = ?', ['admin']);
    console.log('Deleted existing admin user');

    // Verify deletion
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users remaining:', rows[0].count);

    await connection.end();
    console.log('Cleanup completed!');
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
};

cleanup();
