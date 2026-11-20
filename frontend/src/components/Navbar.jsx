import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isProjectsActive = location.pathname === '/' || location.pathname.startsWith('/projects');
  const isMyTasksActive = location.pathname === '/my-tasks';
  const isUsersActive = location.pathname === '/users';

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
          <Link to="/users" className={`nav-link ${isUsersActive ? 'active' : ''}`}>
            <PeopleOutlineOutlinedIcon style={{ fontSize: 18 }} />
            <span>Nhân sự</span>
          </Link>
        </nav>
      </div>

      <div className="nav-user">
        <Link to="/profile" className="user-profile-widget user-profile-link" title="Cài đặt hồ sơ cá nhân">
          <UserAvatar
            name={user?.fullName}
            email={user?.email}
            avatarUrl={user?.avatarUrl}
            size="md"
          />
          <div className="user-meta">
            <div className="user-name-row">
              <span className="user-name">{user?.fullName || 'Thành viên'}</span>
              {user?.systemRole === 'Admin' && (
                <span className="user-role-badge">Admin</span>
              )}
            </div>
            <span className="user-email">{user?.email || 'Thành viên tổ chức'}</span>
          </div>
        </Link>
        <button onClick={logout} className="btn-logout" title="Đăng xuất khỏi hệ thống">
          <LogoutIcon fontSize="small" />
          <span>Thoát</span>
        </button>
      </div>
    </header>
  );
}
