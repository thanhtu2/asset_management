import pool from './database.js';
import bcrypt from 'bcryptjs';
import { getPool, initDatabase } from './database.js';

const seedAdminUser = async () => {
  try {
    // Initialize database first
    await initDatabase();
    
    const db = getPool();
    
    // Check if admin user exists
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (existing.length === 0) {
      // Create admin user with password "admin123"
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        'INSERT INTO users (username, password, fullName, role, isActive) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'Administrator', 'admin', true]
      );
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdminUser();
