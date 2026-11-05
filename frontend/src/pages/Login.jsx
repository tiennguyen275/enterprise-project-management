import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const demoEmail = email.trim() || 'enterprise.user@gmail.com';
      await googleLogin({
        email: demoEmail,
        fullName: demoEmail.split('@')[0],
        googleId: `google-${Date.now()}`,
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-panel">
        <div className="hero-brand">
          <div className="brand-icon-box">
            <AccountTreeOutlinedIcon fontSize="medium" />
          </div>
          <div>
            <div className="brand-title">EPMS Enterprise</div>
            <div className="brand-subtitle">Project Management System</div>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-pill">
            <ShieldOutlinedIcon style={{ fontSize: 14 }} />
            <span>PHIÊN BẢN DOANH NGHIỆP 2026</span>
          </div>

          <h1>
            Nền Tảng Điều Phối Dự Án <br />
            <span className="highlight-gradient">Thông Minh & Chuẩn Mực</span>
          </h1>

          <p className="hero-description">
            Tối ưu hóa nguồn lực, tự động xác định đường găng CPM, cộng tác thời gian thực
            qua SignalR và cố vấn tiến độ cùng Trợ lý AI Gemini.
          </p>

          <div className="hero-features-list">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <AccountTreeOutlinedIcon fontSize="small" />
              </div>
              <div className="feature-text">
                <h4>Đường Găng CPM & Biểu Đồ Gantt</h4>
                <p>Thuật toán 2 lượt Forward/Backward tự động tìm công việc găng có Total Float bằng 0.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <BoltOutlinedIcon fontSize="small" />
              </div>
              <div className="feature-text">
                <h4>Đồng Bộ Kanban Thời Gian Thực</h4>
                <p>Cập nhật tức thì không gián đoạn qua SignalR WebSocket khi kéo thả công việc.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <AutoAwesomeOutlinedIcon fontSize="small" />
              </div>
              <div className="feature-text">
                <h4>Trợ Lý AI Phân Tích Ngữ Cảnh</h4>
                <p>Đọc trực tiếp số liệu dự án thực tế để cảnh báo điểm nghẽn và đề xuất phân công.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          <div className="badge-check">
            <CheckCircleOutlineOutlinedIcon style={{ fontSize: 16, color: '#22c55e' }} />
            <span>Clean Architecture .NET 10</span>
          </div>
          <div className="badge-check">
            <CheckCircleOutlineOutlinedIcon style={{ fontSize: 16, color: '#22c55e' }} />
            <span>React 19 SPA</span>
          </div>
          <div className="badge-check">
            <CheckCircleOutlineOutlinedIcon style={{ fontSize: 16, color: '#22c55e' }} />
            <span>Bảo mật JWT</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card-inner">
          <div className="auth-form-header">
            <h2>Chào Mừng Trở Lại</h2>
            <p>Đăng nhập vào không gian làm việc của bạn</p>
          </div>

          <button
            type="button"
            className="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Đăng nhập với Google</span>
          </button>

          <div className="auth-divider">
            <span>HOẶC TIẾP TỤC VỚI EMAIL</span>
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              <ErrorOutlineOutlinedIcon fontSize="small" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email công vụ</label>
              <div className="input-with-icon">
                <EmailOutlinedIcon fontSize="small" className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="tennguoidung@congty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <span>Mật khẩu</span>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Quên mật khẩu?
                </button>
              </label>
              <div className="input-with-icon">
                <LockOutlinedIcon fontSize="small" className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Chưa có tài khoản công vụ? </span>
            <Link to="/register">Đăng ký thành viên mới</Link>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
