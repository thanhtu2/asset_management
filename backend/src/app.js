import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import rateLimit, { ipKeyGenerator }from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth.routes.js';
import assetRoutes from './routes/asset.routes.js';
import categoryRoutes from './routes/category.routes.js';
import locationRoutes from './routes/location.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import departmentRoutes from './routes/department.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import cronRoutes from './routes/cron.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import vehicleTripRoutes from './routes/vehicleTrip.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js'; // Đảm bảo import từ routes/
import vehicleRegistrationRoutes from './routes/vehicleRegistration.routes.js';
import auditRoutes from './routes/audit.routes.js';

import { initDatabase, testConnection, getPool } from './config/database.js';
import { initCronJobs } from './cron.service.js';

// Lùi ra 2 cấp thư mục (từ src/ ra backend/ rồi ra root/) để đọc file .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - dynamic origin for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Also allow localhost for development
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.FRONTEND_URL // Thêm biến môi trường cho Vercel domain
    ];
    
    // If no origin (server-to-server) or origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin.startsWith('http://192.168.') || origin.startsWith('https://192.168.') || origin.includes('vercel.app')) {
      // Cho phép các máy trong mạng LAN và các domain có đuôi vercel.app
      callback(null, true);
    } else {
      console.log('CORS check for origin:', origin);
      // Từ chối kết nối nhẹ nhàng, không ném Error để tránh văng lỗi 500
      callback(null, false);
    }
  },
  credentials: true
};

// kết nối local với server trên Vercel (nếu có) và các client trong mạng LAN(sử dụng để dev)
// app.use(cors({
//   // Thay thế bằng IP LAN của máy chủ và các client được phép
//   origin: ['http://192.168.89.118:5173', 'http://192.168.89.118:5174', 'http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL],
//   credentials: true
// }));



app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Phục vụ file tĩnh từ thư mục uploads
// app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'))); // DEPRECATED: Insecure, replaced with a secure route

// Secure file download route
app.get('/api/download/:filename', (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Yêu cầu xác thực' });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'asset_management_secret_key_2024'); // Verify token

    const { filename } = req.params;
    // Security: Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      return res.status(400).json({ message: 'Tên file không hợp lệ' });
    }
    const filePath = path.resolve(__dirname, '../uploads', safeFilename);
    res.sendFile(filePath, (err) => { 
      if (err) {
        console.error('Lỗi tải file:', err.message, 'Đường dẫn:', filePath);
        if (!res.headersSent) res.status(404).json({ message: 'Không tìm thấy file trên máy chủ (Có thể đã bị xóa)' }); 
      }
    });
  } catch (error) {
    console.error('Lỗi xác thực tải file:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
});

// Đảm bảo Database kết nối xong trước khi xử lý API trên Vercel (Cold-start fix)
let dbInitialized = false;
let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (process.env.VERCEL && !dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase().then(() => testConnection()).then(() => seedAdminUser());
    }
    try {
      await dbInitPromise;
      dbInitialized = true;
    } catch (error) {
      console.error('Database init error:', error);
      return res.status(500).json({ message: 'Lỗi khởi tạo Serverless Database' });
    }
  }
  next();
});

// Rate limiting for login to prevent Brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Tối đa 5 lần thử
  message: { message: 'Tài khoản này đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Đếm theo Tên đăng nhập (username) thay vì đếm theo IP. Nếu không có username thì mới dùng IP.
    return req.body.username 
    ? req.body.username.toLowerCase().trim()
    : ipKeyGenerator (req.ip);
  }
});

// General API rate limiting để chống DDoS/Spam request chung
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: process.env.VERCEL ? 300 : 3000, // Giữ 300 trên Vercel, tăng lên 3000 khi code local
  message: { message: 'Hệ thống đang bận. Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

// Stricter rate limiting cho các API Public (ví dụ: quét QR báo hỏng)
const publicApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // Tối đa 10 lần báo hỏng / 1 giờ / IP
  message: { message: 'Quá nhiều yêu cầu báo hỏng từ thiết bị của bạn. Vui lòng thử lại sau 1 giờ.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

// Routes
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/assets/public', publicApiLimiter);
app.use('/api/cron', cronRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/vehicle-registrations', vehicleRegistrationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle-trips', vehicleTripRoutes);

// New Logout Route
app.post('/api/auth/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0), // Expire the cookie immediately
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Đăng xuất thành công' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Asset Management API is running' });
});

// Test endpoint - no auth required
app.get('/api/test-assets', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const Asset = (await import('./models/Asset.js')).default;
    const result = await Asset.findAll({}, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Seed admin user - always reset password to ensure it's correct
const seedAdminUser = async () => {
  try {
    const db = getPool();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO users (username, password, fullName, role, isActive) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'Administrator', 'admin', true]
      );
      console.log('Admin user created: admin / admin123');
    } else {
      // Always update password to ensure it's correct
      await db.query(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, 'admin']
      );
      console.log('Admin password reset: admin / admin123');
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

// Start server
// Kiểm tra: Nếu không chạy trên Vercel thì mới dùng app.listen (Local)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await initDatabase();
    await testConnection();
    await seedAdminUser();
    initCronJobs(); // Khởi chạy cron jobs (Lưu ý: Không dùng trên Vercel Serverless)
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Lỗi: Cổng ${PORT} đã bị chiếm dụng. Vui lòng tắt ứng dụng đang dùng cổng này hoặc đổi PORT trong file .env.`);
      process.exit(1);
    }
  });
}

export default app;
