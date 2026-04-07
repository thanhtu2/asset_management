import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = searchParams.get('redirect') || location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', width: 'max(300px, 50vw)', height: 'max(300px, 50vw)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
        top: '-80px', left: '-80px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 'max(200px, 40vw)', height: 'max(200px, 40vw)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
        bottom: '0px', right: '60px', pointerEvents: 'none',
      }} />

      <div className="login-box" style={{ position: 'relative', zIndex: 1, margin: '0 15px', width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            boxShadow: '0 8px 24px rgba(37,99,235,0.35)'
          }}>
            🏛️
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: 4 }}>
          Asset Management
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 28 }}>
          Đăng nhập để tiếp tục
        </p>

        {error && (
          <div className="alert alert-error">
            <span style={{ marginRight: 6 }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px 20px', fontSize: 14, marginTop: 8 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block'
                }} />
                Đang đăng nhập...
              </span>
            ) : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
          © 2026 Asset Management System
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
