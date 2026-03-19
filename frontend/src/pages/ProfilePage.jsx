import { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({ fullName: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({ fullName: user.fullName || '' });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage({ type: '', text: '' });
    try {
      await authAPI.updateProfile(profileData);
      setProfileMessage({ type: 'success', text: 'Cập nhật tên thành công! Vui lòng đăng nhập lại để thay đổi có hiệu lực toàn hệ thống.' });
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi khi cập nhật thông tin' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    
    setLoading(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      await authAPI.changePassword({ 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi khi đổi mật khẩu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Hồ sơ cá nhân</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Cập nhật thông tin</h2>
          {profileMessage.text && (
            <div className={`alert alert-${profileMessage.type === 'success' ? 'good' : 'error'}`} style={{ marginBottom: '15px' }}>
              {profileMessage.text}
            </div>
          )}
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input type="text" value={user?.username || ''} disabled style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label>Vai trò</label>
              <input type="text" value={user?.role_name || user?.role || ''} disabled style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label>Họ và tên</label>
              <input type="text" value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>Lưu thông tin</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Đổi mật khẩu</h2>
          {passwordMessage.text && (
            <div className={`alert alert-${passwordMessage.type === 'success' ? 'good' : 'error'}`} style={{ marginBottom: '15px' }}>
              {passwordMessage.text}
            </div>
          )}
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>Đổi mật khẩu</button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;