import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'asset_management_secret_key_2024';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - path:', req.path, 'authHeader:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const [perms] = await pool.query('SELECT permission_code FROM role_permissions WHERE role_code = ?', [decoded.role]);
    decoded.permissions = perms.map(p => p.permission_code);

    req.user = decoded;
    console.log('Auth middleware - success, user:', decoded);
    next();
  } catch (error) {
    console.log('Auth middleware - error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};
