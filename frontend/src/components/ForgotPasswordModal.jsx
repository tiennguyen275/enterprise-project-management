import React, { useState } from 'react';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const { forgotPassword, verifyOtp, resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setDemoOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    onClose();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPassword);
      setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-modal-backdrop" onClick={handleClose}>
      <div className="otp-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </button>

        <div className="otp-header">
          <div className="otp-icon-box">
            {step === 1 && <LockResetOutlinedIcon fontSize="medium" />}
            {step === 2 && <MarkEmailReadOutlinedIcon fontSize="medium" />}
            {step === 3 && <CheckCircleOutlineOutlinedIcon fontSize="medium" />}
          </div>
          <h3>
            {step === 1 && 'Khôi Phục Mật Khẩu'}
            {step === 2 && 'Xác Thực Mã OTP'}
            {step === 3 && 'Đặt Mật Khẩu Mới'}
          </h3>
          <p>
            {step === 1 && 'Nhập email tài khoản để nhận mã OTP xác thực 6 số.'}
            {step === 2 && `Mã xác thực đã được gửi tới ${email}. Vui lòng nhập 6 số bên dưới.`}
            {step === 3 && 'Tạo mật khẩu mới có tối thiểu 6 ký tự để bảo vệ tài khoản.'}
          </p>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <ErrorOutlineOutlinedIcon fontSize="small" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-success" style={{ marginBottom: '1rem', color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span>{successMsg}</span>
          </div>
        )}

        {demoOtp && step === 2 && (
          <div className="demo-otp-badge">
            <span>Mã OTP thử nghiệm nhanh:</span>
            <strong>{demoOtp}</strong>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="otp-form">
            <div className="form-group">
              <label>Email tài khoản</label>
              <input
                type="email"
                required
                placeholder="tennguoidung@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading || !email.trim()}>
              {loading ? 'Đang gửi mã...' : 'Gửi Mã Xác Thực'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="otp-form">
            <div className="form-group">
              <label>Mã xác thực OTP (6 chữ số)</label>
              <input
                type="text"
                required
                maxLength={6}
                className="otp-input-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading || otp.length < 6}>
              {loading ? 'Đang xác thực...' : 'Xác Nhận Mã'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Nhập lại email khác
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="otp-form">
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
