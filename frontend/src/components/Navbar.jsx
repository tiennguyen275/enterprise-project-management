import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import GlobalSearchModal from './GlobalSearchModal';
import NotificationBell from './NotificationBell';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const isProjectsActive = location.pathname === '/' || location.pathname.startsWith('/projects');
  const isMyTasksActive = location.pathname === '/my-tasks';
  const isUsersActive = location.pathname === '/users';

  return (
    <>
      <header className="navbar">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            <div className="brand-logo-icon">
              <AccountTreeOutlinedIcon fontSize="small" />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">EPMS</span>
              <span className="brand-version-badge">v2026</span>
            </div>
          </Link>

          <nav className="nav-links">
            <Link to="/" className={`nav-link ${isProjectsActive ? 'active' : ''}`}>
              <FolderSpecialOutlinedIcon style={{ fontSize: 17 }} />
              <span>Dự án</span>
            </Link>
            <Link to="/my-tasks" className={`nav-link ${isMyTasksActive ? 'active' : ''}`}>
              <AssignmentOutlinedIcon style={{ fontSize: 17 }} />
              <span>Công việc</span>
            </Link>
            <Link to="/users" className={`nav-link ${isUsersActive ? 'active' : ''}`}>
              <PeopleOutlineOutlinedIcon style={{ fontSize: 17 }} />
              <span>Nhân sự</span>
            </Link>
          </nav>
        </div>

        <div className="nav-center">
          <button
            type="button"
            className="navbar-search-trigger"
            onClick={() => setSearchOpen(true)}
            title="Tìm kiếm toàn cục (Ctrl + K)"
          >
            <SearchIcon className="search-trigger-icon" style={{ fontSize: 18 }} />
            <span className="search-trigger-text">Tìm nhanh dự án, công việc, nhân sự...</span>
            <span className="search-trigger-keys">
              <kbd>Ctrl</kbd>
              <kbd>K</kbd>
            </span>
          </button>
        </div>

        <div className="nav-user">
          <NotificationBell />
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
            <LogoutIcon style={{ fontSize: 17 }} />
          </button>
        </div>
      </header>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
