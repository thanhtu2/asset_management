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
    <div
      className="login-container"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        // background: 'linear-gradient(135deg, #6fa6ff 0%, #3fcbf5 35%, #3b8bec 65%, #34b8e0 100%)',
      }}
    >
      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', width: 'max(360px, 55vw)', height: 'max(360px, 55vw)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(44, 189, 252, 0.88) 0%, transparent 70%)',
        top: '-120px', left: '-100px', pointerEvents: 'none', filter: 'blur(10px)',
      }} />
      <div style={{
        position: 'absolute', width: 'max(260px, 42vw)', height: 'max(260px, 42vw)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(150, 195, 252, 0.5) 0%, transparent 70%)',
        bottom: '-60px', right: '0px', pointerEvents: 'none', filter: 'blur(10px)',
      }} />

      {/* Floating bubbles */}
      {[
        { size: 90, top: '12%', left: '8%', delay: '0s', dur: '9s' },
        { size: 46, top: '68%', left: '14%', delay: '1.2s', dur: '7s' },
        { size: 130, top: '18%', right: '10%', delay: '0.6s', dur: '11s' },
        { size: 56, top: '76%', right: '18%', delay: '2s', dur: '8s' },
        { size: 30, top: '45%', left: '22%', delay: '1.6s', dur: '6.5s' },
      ].map((b, i) => (
        <span
          key={i}
          className="login-bubble"
          style={{
            position: 'absolute',
            width: b.size, height: b.size,
            top: b.top, left: b.left, right: b.right,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(2px)',
            animation: `bubbleFloat ${b.dur} ease-in-out ${b.delay} infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        className="login-box"
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '0 15px',
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.28)',
          borderRadius: 24,
          padding: '36px 32px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #1473E6, #34b8e0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            boxShadow: '0 8px 24px rgba(20,115,230,0.45)'
          }}>
            🏛️
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', textAlign: 'center', marginBottom: 4, letterSpacing: '0.01em' }}>
          Asset Management
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 28 }}>
          Đăng nhập để tiếp tục
        </p>

        {error && (
          <div
            className="alert alert-error"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fecaca',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <span style={{ marginRight: 6 }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)', display: 'flex',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)', display: 'flex',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.65)',
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

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 999,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              background: 'linear-gradient(135deg, #1375ec, #22d3ee)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 10px 24px rgba(20,115,230,0.4)',
              transition: 'transform 0.13s ease-out, box-shadow 0.13s ease-out',
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block'
                }} />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          © 2026 Asset Management System
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        .login-box input::placeholder { color: rgba(255,255,255,0.5); }
        .login-box input:focus {
          border-color: #1375ec !important;
          background: rgba(255,255,255,0.14) !important;
          box-shadow: 0 0 0 3px rgba(19,117,236,0.25);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(20,115,230,0.5) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .login-bubble { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;