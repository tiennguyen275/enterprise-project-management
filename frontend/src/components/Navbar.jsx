import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isProjectsActive = location.pathname === '/' || location.pathname.startsWith('/projects');
  const isMyTasksActive = location.pathname === '/my-tasks';

  return (
    <header className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          <FolderSpecialOutlinedIcon fontSize="medium" color="primary" />
          <span>Enterprise Project Manager</span>
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
        <span className="user-greeting">
          Xin chào, <strong>{user?.fullName}</strong>
        </span>
        <button onClick={logout} className="btn-logout" title="Đăng xuất">
          <LogoutIcon fontSize="small" />
          <span>Thoát</span>
        </button>
      </div>
    </header>
  );
}
