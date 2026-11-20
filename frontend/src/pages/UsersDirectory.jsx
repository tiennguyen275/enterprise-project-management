import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UserAvatar from '../components/UserAvatar';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SearchIcon from '@mui/icons-material/Search';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

export default function UsersDirectory() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.systemRole === 'Admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionBusyId, setActionBusyId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    let isMounted = true;
    api.get('/users')
      .then((res) => {
        if (isMounted) setUsers(res.data);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách nhân sự:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleRole = async (target) => {
    const nextRoleEnum = target.systemRole === 'Admin' ? 0 : 1;
    setActionBusyId(target.id);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.patch(`/users/${target.id}/role`, { systemRole: nextRoleEnum });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? res.data : u)));
      setFeedback({
        type: 'success',
        message: `Đã cập nhật vai trò của ${res.data.fullName} thành ${res.data.systemRole === 'Admin' ? 'Quản trị viên (Admin)' : 'Nhân viên'}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể cập nhật vai trò người dùng.',
      });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleToggleActive = async (target) => {
    setActionBusyId(target.id);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.patch(`/users/${target.id}/status`, { isActive: !target.isActive });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? res.data : u)));
      setFeedback({
        type: 'success',
        message: `Đã ${res.data.isActive ? 'kích hoạt lại' : 'tạm khóa'} tài khoản ${res.data.fullName}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản.',
      });
    } finally {
      setActionBusyId(null);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.systemRole === 'Admin').length;
  const activeCount = users.filter((u) => u.isActive).length;
  const totalAssigned = users.reduce((sum, u) => sum + (u.assignedTaskCount || 0), 0);

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'admin' && u.systemRole !== 'Admin') return false;
    if (roleFilter === 'user' && u.systemRole !== 'User') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="users-directory-layout">
      <Navbar />

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Danh Bạ Nhân Sự</h1>
            <p>
              {isAdmin
                ? 'Quản lý danh sách thành viên, phân quyền Quản trị hệ thống và theo dõi phân bổ công việc'
                : 'Danh sách thành viên và ảnh đại diện các nhân sự trong hệ thống doanh nghiệp'}
            </p>
          </div>
        </div>

        <div className="users-kpi-grid">
          <div className="user-kpi-card kpi-total">
            <div className="kpi-icon icon-blue">
              <PeopleOutlineOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Tổng nhân sự</span>
              <strong className="kpi-value">{totalUsers}</strong>
            </div>
          </div>

          <div className="user-kpi-card kpi-admin">
            <div className="kpi-icon icon-purple">
              <AdminPanelSettingsOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Quản trị viên (Admin)</span>
              <strong className="kpi-value">{adminCount}</strong>
            </div>
          </div>

          <div className="user-kpi-card kpi-active">
            <div className="kpi-icon icon-green">
              <VerifiedUserOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Đang hoạt động</span>
              <strong className="kpi-value">{activeCount}</strong>
            </div>
          </div>

          <div className="user-kpi-card kpi-tasks">
            <div className="kpi-icon icon-indigo">
              <AssignmentOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Tổng việc phân công</span>
              <strong className="kpi-value">{totalAssigned}</strong>
            </div>
          </div>
        </div>

        {feedback.message && (
          <div className={`users-feedback-banner ${feedback.type === 'error' ? 'is-error' : 'is-success'}`}>
            {feedback.message}
          </div>
        )}

        <div className="users-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              Tất cả ({totalUsers})
            </button>
            <button
              className={`filter-tab ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              Admin ({adminCount})
            </button>
            <button
              className={`filter-tab ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >
              Nhân viên ({totalUsers - adminCount})
            </button>
          </div>

          <div className="search-box">
            <SearchIcon className="search-icon" fontSize="small" />
            <input
              type="text"
              placeholder="Tìm theo họ tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Đang tải danh sách nhân sự...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <PeopleOutlineOutlinedIcon style={{ fontSize: 54, color: '#94a3b8' }} />
            <h3>Không tìm thấy nhân sự phù hợp</h3>
            <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò.</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentUser?.userId;
              const isBusy = actionBusyId === u.id;
              return (
                <div
                  key={u.id}
                  className={`user-directory-card ${u.systemRole === 'Admin' ? 'is-admin' : ''} ${!u.isActive ? 'is-inactive' : ''}`}
                >
                  <div className="user-card-top">
                    <UserAvatar name={u.fullName} email={u.email} avatarUrl={u.avatarUrl} size="lg" />
                    <div className="user-card-identity">
                      <div className="user-card-name-row">
                        <h3>{u.fullName}</h3>
                        {isSelf && <span className="badge-self">Bạn</span>}
                      </div>
                      <span className="user-card-email">{u.email}</span>
                      <div className="user-card-badges">
                        <span className={`role-pill ${u.systemRole === 'Admin' ? 'pill-admin' : 'pill-user'}`}>
                          {u.systemRole === 'Admin' ? 'System Admin' : 'Nhân viên'}
                        </span>
                        <span className={`status-pill ${u.isActive ? 'pill-active' : 'pill-locked'}`}>
                          {u.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="user-card-metrics">
                    <div className="metric-item">
                      <FolderSpecialOutlinedIcon style={{ fontSize: 16 }} />
                      <span><strong>{u.projectCount}</strong> dự án</span>
                    </div>
                    <div className="metric-item">
                      <AssignmentOutlinedIcon style={{ fontSize: 16 }} />
                      <span><strong>{u.assignedTaskCount}</strong> công việc</span>
                    </div>
                  </div>

                  {isAdmin && !isSelf && (
                    <div className="user-card-actions">
                      <button
                        type="button"
                        className="btn-user-action"
                        disabled={isBusy}
                        onClick={() => handleToggleRole(u)}
                      >
                        <SecurityOutlinedIcon style={{ fontSize: 15 }} />
                        <span>{u.systemRole === 'Admin' ? 'Hạ về Nhân viên' : 'Cấp quyền Admin'}</span>
                      </button>
                      <button
                        type="button"
                        className={`btn-user-action ${u.isActive ? 'btn-danger-outline' : 'btn-success-outline'}`}
                        disabled={isBusy}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? <LockOutlinedIcon style={{ fontSize: 15 }} /> : <LockOpenOutlinedIcon style={{ fontSize: 15 }} />}
                        <span>{u.isActive ? 'Khóa' : 'Mở khóa'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

