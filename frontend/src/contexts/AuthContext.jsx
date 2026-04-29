import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Trình duyệt sẽ tự động gửi HTTP-only cookie nếu có phiên đăng nhập
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        // Không có cookie hoặc phiên không hợp lệ
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (username, password) => {
    const response = await authAPI.login(username, password);
    // Server hiện đã gán token vào cookie, chỉ lấy user data
    const userData = response.data.user || response.data;
    
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authAPI.logout(); // Yêu cầu backend vô hiệu hóa cookie
    } catch (error) {
      console.error("Logout failed on server:", error);
    } finally {
      localStorage.removeItem('token'); // Đảm bảo xóa token cũ nếu còn kẹt
      localStorage.removeItem('user');
      setUser(null);
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    }
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};