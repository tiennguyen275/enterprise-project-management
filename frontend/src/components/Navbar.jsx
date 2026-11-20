import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isProjectsActive = location.pathname === '/' || location.pathname.startsWith('/projects');
  const isMyTasksActive = location.pathname === '/my-tasks';

  const userInitial = user?.fullName
    ? user.fullName.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          <div className="brand-logo-icon">
            <AccountTreeOutlinedIcon fontSize="small" />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">EPMS Enterprise</span>
            <span className="brand-version-badge">v2026</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isProjectsActive ? 'active' : ''}`}>
            <FolderSpecialOutlinedIcon style={{ fontSize: 18 }} />
            <span>Dự án</span>
          </Link>
          <Link to="/my-tasks" className={`nav-link ${isMyTasksActive ? 'active' : ''}`}>
            <AssignmentOutlinedIcon style={{ fontSize: 18 }} />
            <span>Công việc của tôi</span>
          </Link>
        </nav>
      </div>

      <div className="nav-user">
        <div className="user-profile-widget">
          <div className="user-avatar-circle" title={user?.email || ''}>
            {userInitial}
          </div>
          <div className="user-meta">
            <div className="user-name-row">
              <span className="user-name">{user?.fullName || 'Thành viên'}</span>
              {user?.systemRole === 'Admin' && (
                <span className="user-role-badge">Admin</span>
              )}
            </div>
            <span className="user-email">{user?.email || 'Thành viên tổ chức'}</span>
          </div>
        </div>
        <button onClick={logout} className="btn-logout" title="Đăng xuất khỏi hệ thống">
          <LogoutIcon fontSize="small" />
          <span>Thoát</span>
        </button>
      </div>
    </header>
  );
}
