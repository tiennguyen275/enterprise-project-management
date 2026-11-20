import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UserAvatar from '../components/UserAvatar';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

const AVATAR_PRESETS = [
  { label: 'Chuyên gia 1', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=QuanPM&backgroundColor=dbeafe' },
  { label: 'Chuyên gia 2', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ThaoVy&backgroundColor=ede9fe' },
  { label: 'Chuyên gia 3', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=HoangNam&backgroundColor=dcfce7' },
  { label: 'Chuyên gia 4', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ThuHa&backgroundColor=fef3c7' },
  { label: 'Chuyên gia 5', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=GiaBao&backgroundColor=fce7f3' },
  { label: 'Chuyên gia 6', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=EnterpriseLead&backgroundColor=e0f2fe' },
];

function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp đã chọn.'));
    reader.readAsDataURL(file);
  });
}

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [stats, setStats] = useState({ projectCount: 0, assignedTaskCount: 0, createdAt: null });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    let isMounted = true;
    api.get('/users/me')
      .then((res) => {
        if (!isMounted) return;
        setFullName(res.data.fullName || '');
        setAvatarUrl(res.data.avatarUrl || '');
        setStats({
          projectCount: res.data.projectCount || 0,
          assignedTaskCount: res.data.assignedTaskCount || 0,
          createdAt: res.data.createdAt,
        });
      })
      .catch((err) => {
        console.error('Lỗi tải hồ sơ cá nhân:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback({ type: '', message: '' });
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP).' });
      return;
    }
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.put('/users/me', {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      updateUser({
        fullName: res.data.fullName,
        avatarUrl: res.data.avatarUrl,
        systemRole: res.data.systemRole,
      });
      setFeedback({ type: 'success', message: 'Đã lưu thay đổi hồ sơ và cập nhật ảnh đại diện thành công!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể cập nhật hồ sơ cá nhân.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-settings-layout">
      <Navbar />

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Cài Đặt Hồ Sơ Cá Nhân</h1>
            <p>Cập nhật tên hiển thị và ảnh đại diện của bạn trên toàn hệ thống EPMS Enterprise</p>
          </div>
        </div>

        <div className="profile-settings-grid">
          <section className="profile-preview-card">
            <div className="preview-avatar-wrap">
              <UserAvatar
                name={fullName || user?.fullName}
                email={user?.email}
                avatarUrl={avatarUrl}
                size="xl"
              />
            </div>
            <h2>{fullName || user?.fullName || 'Thành viên'}</h2>
            <p className="preview-email">{user?.email}</p>
            <span className={`role-pill ${user?.systemRole === 'Admin' ? 'pill-admin' : 'pill-user'}`}>
              {user?.systemRole === 'Admin' ? 'System Admin' : 'Nhân viên'}
            </span>

            <div className="preview-stats-row">
              <div className="preview-stat">
                <FolderSpecialOutlinedIcon style={{ fontSize: 18, color: '#0284c7' }} />
                <strong>{stats.projectCount}</strong>
                <span>Dự án</span>
              </div>
              <div className="preview-stat">
                <AssignmentOutlinedIcon style={{ fontSize: 18, color: '#6366f1' }} />
                <strong>{stats.assignedTaskCount}</strong>
                <span>Công việc</span>
              </div>
            </div>
          </section>

          <section className="profile-form-card">
            <form onSubmit={handleSave}>
              {feedback.message && (
                <div className={`profile-feedback ${feedback.type === 'error' ? 'is-error' : 'is-success'}`}>
                  {feedback.type === 'error' ? (
                    <ErrorOutlineOutlinedIcon fontSize="small" />
                  ) : (
                    <CheckCircleOutlineOutlinedIcon fontSize="small" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="form-group">
                <label>Email công vụ (không thể thay đổi)</label>
                <input type="email" value={user?.email || ''} disabled className="input-disabled" />
              </div>

              <div className="form-group">
                <label htmlFor="profile-fullname">Họ và tên hiển thị</label>
                <input
                  id="profile-fullname"
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div className="form-group">
                <label>Ảnh đại diện (Avatar)</label>
                <div className="avatar-upload-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="btn-outline-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudUploadOutlinedIcon fontSize="small" />
                    <span>Tải ảnh từ máy tính</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      className="btn-outline-remove"
                      onClick={() => setAvatarUrl('')}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                      <span>Dùng chữ viết tắt</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Hoặc chọn nhanh bộ Avatar doanh nghiệp</label>
                <div className="avatar-presets-grid">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      className={`preset-avatar-btn ${avatarUrl === preset.url ? 'selected' : ''}`}
                      onClick={() => setAvatarUrl(preset.url)}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-avatar-url">Hoặc dán đường dẫn URL ảnh</label>
                <input
                  id="profile-avatar-url"
                  type="url"
                  value={avatarUrl.startsWith('data:image/') ? '' : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div className="profile-form-footer">
                <button type="submit" className="btn-primary" disabled={saving}>
                  <SaveOutlinedIcon fontSize="small" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

