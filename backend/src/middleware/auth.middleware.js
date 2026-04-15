import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    // 1. Ưu tiên đọc Token từ HTTP-only Cookie (Cách mới)
    let token = req.cookies?.token;
    
    // 2. Fallback: Nếu không có Cookie, thử đọc từ header Authorization (Hỗ trợ cách cũ / Test Postman)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Yêu cầu xác thực. Không tìm thấy phiên đăng nhập.' });
    }

    // 3. Giải mã và kiểm tra Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asset_management_secret_key_2024');
    req.user = decoded; // Gắn thông tin user vào request để các API sau sử dụng
    
    next();
  } catch (error) {
    console.error('Lỗi xác thực Middleware:', error.message);
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Từ chối truy cập. Chức năng này chỉ dành cho Quản trị viên.' });
  }
};
