import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const createDatabase = async () => {
  try {
    if (process.env.VERCEL) {
      console.log('--- KIỂM TRA KẾT NỐI DB TRÊN VERCEL ---');
      console.log('Host:', process.env.DB_HOST);
      console.log('Port:', process.env.DB_PORT);
      console.log('User:', process.env.DB_USER);
      console.log('DB Name:', process.env.DB_NAME);
      console.log('---------------------------------------');
    }

    const dbName = (process.env.DB_NAME || 'asset_management').trim();

    const connection = await mysql.createConnection({
      host: (process.env.DB_HOST || 'localhost').trim(),
      port: parseInt((process.env.DB_PORT || '3306').toString().trim(), 10),
      user: (process.env.DB_USER || 'root').trim(),
      password: process.env.DB_PASSWORD || '123456',
      ssl: { rejectUnauthorized: false }
    });

    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
      console.log('Database created or already exists!');
    } catch (dbError) {
      console.log('Bỏ qua tạo DB do Cloud provider quản lý quyền:', dbError.message);
    }

    await connection.query(`USE ${dbName}`);

    // Đọc và chạy init.sql
    if (!process.env.VERCEL) {
      const initSqlPath = path.join(__dirname, 'init.sql');
      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        const statements = initSql.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await connection.query(statement);
              console.log('Statement executed:', statement.substring(0, 50) + '...');
            } catch (e) {
              const errMsg = e.message || e.sqlMessage || '';
              if (!errMsg.includes('Unknown database') && !errMsg.includes('Already exists')) {
                console.log('Statement skipped:', errMsg);
              }
            }
          }
        }
      }
    } else {
      console.log('Bỏ qua đọc file init.sql vì đang chạy trên Vercel.');
    }

    // Fix missing columns
    try {
      await connection.query('ALTER TABLE inventory_records ADD COLUMN actual_quantity INT DEFAULT 0 AFTER status');
      console.log('Added actual_quantity column to inventory_records');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE inventory_records ADD COLUMN actual_location_id INT NULL AFTER image_url');
      console.log('Added actual_location_id column to inventory_records');
    } catch (e) {}

    try {
      await connection.query("ALTER TABLE inventory_records MODIFY COLUMN status VARCHAR(30) DEFAULT 'pending_check' NOT NULL");
      console.log('Modified inventory_records status column to VARCHAR');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE vehicle_registrations CHANGE COLUMN owner_id requester_id INT NULL');
      console.log('Đã đổi tên owner_id thành requester_id trong bảng vehicle_registrations');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE vehicle_registrations ADD COLUMN vehicle_id INT NULL AFTER requester_id');
      console.log('Đã thêm cột vehicle_id vào bảng vehicle_registrations');
    } catch (e) {}

    try {
      const [regNumCols] = await connection.query("SHOW COLUMNS FROM vehicle_registrations LIKE 'registration_number'");
      if (regNumCols.length === 0) {
        await connection.query('ALTER TABLE vehicle_registrations ADD COLUMN registration_number VARCHAR(50) UNIQUE NOT NULL AFTER id');
        console.log('Đã thêm cột registration_number vào bảng vehicle_registrations');
      }
    } catch (e) {}

    try {
      const [vrStatus] = await connection.query("SHOW COLUMNS FROM vehicle_registrations LIKE 'status'");
      if (vrStatus.length === 0) {
        await connection.query("ALTER TABLE vehicle_registrations ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending' AFTER notes");
        console.log('Đã thêm cột status vào bảng vehicle_registrations');
      }
    } catch (e) {}

    try {
      const [vtStatus] = await connection.query("SHOW COLUMNS FROM vehicle_trips LIKE 'status'");
      if (vtStatus.length === 0) {
        await connection.query("ALTER TABLE vehicle_trips ADD COLUMN status ENUM('leader_pending', 'coordinator_pending', 'approved', 'rejected', 'ongoing', 'completed', 'cancelled') DEFAULT 'leader_pending' AFTER purpose");
        console.log('Đã thêm cột status vào bảng vehicle_trips');
      }
    } catch (e) {}

    // Đảm bảo bảng assets tồn tại trước khi tạo vehicles
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS assets (
          id INT PRIMARY KEY AUTO_INCREMENT,
          asset_code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          category_id INT NULL,
          department_id INT NULL,
          location_id INT NULL,
          status ENUM('new', 'good', 'needs_repair', 'damaged', 'disposed') DEFAULT 'new',
          purchase_date DATE NULL,
          purchase_price DECIMAL(15,2) NULL,
          warranty_expiry DATE NULL,
          description TEXT NULL,
          image_url VARCHAR(500) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}

    // Đảm bảo bảng vehicles tồn tại
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id INT PRIMARY KEY AUTO_INCREMENT,
          asset_id INT UNIQUE NULL,
          plate_number VARCHAR(20) UNIQUE NOT NULL,
          vehicle_type VARCHAR(100),
          brand VARCHAR(100),
          model VARCHAR(100),
          seats INT,
          current_km INT DEFAULT 0,
          status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
          inspection_expiration DATE,
          insurance_expiration DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
        )
      `);
      console.log('Đảm bảo bảng vehicles đã tồn tại');
    } catch (e) {}

    // Kiểm tra và thêm cột brand vào bảng vehicles
    try {
      const [brandCols] = await connection.query("SHOW COLUMNS FROM vehicles LIKE 'brand'");
      if (brandCols.length === 0) {
        try {
          await connection.query('ALTER TABLE vehicles ADD COLUMN brand VARCHAR(100) NULL AFTER vehicle_type');
          console.log('Added brand column to vehicles');
        } catch (e) { console.error('Lỗi thêm cột brand:', e.message); }
      }
    } catch (e) {
      console.log('Bảng vehicles chưa tồn tại, bỏ qua kiểm tra cột brand');
    }

    // Dọn dẹp cột brand thừa
    const tablesToCleanup = ['vehicle_registrations', 'vehicle_trips'];
    for (const table of tablesToCleanup) {
      try {
        const [extraCols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'brand'`);
        if (extraCols.length > 0) {
          await connection.query(`ALTER TABLE ${table} DROP COLUMN brand`);
          console.log(`Đã xóa cột brand thừa từ bảng ${table}`);
        }
      } catch (e) {}
    }

    try {
      await connection.query('ALTER TABLE purchase_proposals MODIFY COLUMN requester_id INT NULL');
      console.log('Fixed purchase_proposals.requester_id to be NULLable');
    } catch (e) {}

    console.log('Database tables initialized!');

    try {
      await connection.query(`ALTER TABLE assets MODIFY COLUMN status ENUM('new', 'good', 'needs_repair', 'damaged', 'disposed') DEFAULT 'new'`);
      console.log('Fixed assets.status ENUM');
    } catch (e) {}

    try {
      await connection.query(`ALTER TABLE maintenance_records ADD COLUMN status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' AFTER next_maintenance_date`);
      console.log('Added maintenance_records.status column');
    } catch (e) {}

    try {
      await connection.query(`ALTER TABLE maintenance_records ADD COLUMN completion_date DATE AFTER status`);
      console.log('Added maintenance_records.completion_date column');
    } catch (e) {}

    await connection.end();
    return true;
  } catch (error) {
    console.error('Database setup failed:', error.message);
    return false;
  }
};

let pool = null;

export const initDatabase = async () => {
  await createDatabase();

  pool = mysql.createPool({
    host: (process.env.DB_HOST || 'localhost').trim(),
    port: parseInt((process.env.DB_PORT || '3306').toString().trim(), 10),
    user: (process.env.DB_USER || 'root').trim(),
    password: process.env.DB_PASSWORD || '123456',
    database: (process.env.DB_NAME || 'asset_management').trim(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4_unicode_ci',
    ssl: { rejectUnauthorized: false }
  });

  return pool;
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
};

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

const poolProxy = new Proxy({}, {
  get: (target, prop) => {
    if (!pool) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool[prop];
  }
});

export default poolProxy;