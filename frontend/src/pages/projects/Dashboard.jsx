import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { matchesSearch } from '../../utils/textSearch';
import Navbar from '../../components/layout/Navbar';
import UserAvatar from '../../components/common/UserAvatar';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.systemRole === 'Admin';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', code: '', description: '' });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/projects')
      .then((res) => {
        if (isMounted) setProjects(res.data);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách dự án:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const res = await api.post('/projects', newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', code: '', description: '' });
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Không thể tạo dự án.');
    }
  };

  const totalProjects = projects.length;
  const totalAllTasks = projects.reduce((acc, p) => acc + (p.totalTasks || 0), 0);
  const completedAllTasks = projects.reduce((acc, p) => acc + (p.completedTasks || 0), 0);
  const overallRate = totalAllTasks > 0 ? Math.round((completedAllTasks / totalAllTasks) * 100) : 0;

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((proj) => {
      const progress = proj.totalTasks > 0
        ? Math.round((proj.completedTasks / proj.totalTasks) * 100)
        : 0;
      if (statusFilter === 'completed' && progress < 100) return false;
      if (statusFilter === 'in_progress' && progress >= 100) return false;
      if (searchQuery.trim()) {
        const hit =
          matchesSearch(proj.name, searchQuery) ||
          matchesSearch(proj.code, searchQuery) ||
          matchesSearch(proj.description, searchQuery);
        if (!hit) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'progress') {
        const pa = a.totalTasks > 0 ? a.completedTasks / a.totalTasks : 0;
        const pb = b.totalTasks > 0 ? b.completedTasks / b.totalTasks : 0;
        return pb - pa;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'vi');
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [projects, searchQuery, statusFilter, sortBy]);

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Không Gian Làm Việc</h1>
            <p>
              {isAdmin
                ? 'Chế độ Quản trị Hệ thống — Theo dõi toàn bộ dự án của doanh nghiệp'
                : 'Theo dõi tiến độ và các dự án doanh nghiệp của bạn'}
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <AddIcon fontSize="small" />
            <span>Tạo Dự Án Mới</span>
          </button>
        </div>

        {!loading && projects.length > 0 && (
          <div className="dashboard-stats-overview">
            <div className="dash-stat-box box-projects">
              <div className="stat-icon-wrapper icon-blue">
                <FolderSpecialOutlinedIcon fontSize="small" />
              </div>
              <div className="stat-content">
                <span className="stat-caption">Dự án hoạt động</span>
                <strong className="stat-number">{totalProjects}</strong>
              </div>
            </div>

            <div className="dash-stat-box box-tasks">
              <div className="stat-icon-wrapper icon-indigo">
                <AssignmentOutlinedIcon fontSize="small" />
              </div>
              <div className="stat-content">
                <span className="stat-caption">Tổng số công việc</span>
                <strong className="stat-number">{totalAllTasks}</strong>
              </div>
            </div>

            <div className="dash-stat-box box-completed">
              <div className="stat-icon-wrapper icon-green">
                <CheckCircleOutlineOutlinedIcon fontSize="small" />
              </div>
              <div className="stat-content">
                <span className="stat-caption">Công việc hoàn tất</span>
                <strong className="stat-number">{completedAllTasks}</strong>
              </div>
            </div>

            <div className="dash-stat-box box-rate">
              <div className="stat-icon-wrapper icon-purple">
                <TrendingUpIcon fontSize="small" />
              </div>
              <div className="stat-content">
                <span className="stat-caption">Tỷ lệ hoàn thành</span>
                <strong className="stat-number">{overallRate}%</strong>
              </div>
            </div>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="dashboard-toolbar">
            <div className="toolbar-search">
              <SearchIcon className="toolbar-search-icon" fontSize="small" />
              <input
                type="text"
                placeholder="Lọc nhanh dự án theo tên, mã hoặc mô tả (không dấu)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="toolbar-controls">
              <div className="segmented-filter">
                <button
                  type="button"
                  className={statusFilter === 'all' ? 'active' : ''}
                  onClick={() => setStatusFilter('all')}
                >
                  Tất cả ({projects.length})
                </button>
                <button
                  type="button"
                  className={statusFilter === 'in_progress' ? 'active' : ''}
                  onClick={() => setStatusFilter('in_progress')}
                >
                  Đang triển khai
                </button>
                <button
                  type="button"
                  className={statusFilter === 'completed' ? 'active' : ''}
                  onClick={() => setStatusFilter('completed')}
                >
                  Hoàn thành
                </button>
              </div>

              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sắp xếp dự án"
              >
                <option value="newest">Mới nhất</option>
                <option value="progress">Tiến độ cao nhất</option>
                <option value="name">Tên A - Z</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Đang tải dữ liệu dự án...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderSpecialOutlinedIcon style={{ fontSize: 60, color: '#94a3b8' }} />
            <h3>Chưa có dự án nào</h3>
            <p>Bắt đầu ngay bằng việc tạo dự án đầu tiên của bạn</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <AddIcon fontSize="small" />
              <span>Tạo Dự Án</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <SearchIcon style={{ fontSize: 52, color: '#94a3b8' }} />
            <h3>Không tìm thấy dự án phù hợp</h3>
            <p>Thử từ khóa khác hoặc đặt lại bộ lọc trạng thái.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map((proj) => {
              const progress = proj.totalTasks > 0
                ? Math.round((proj.completedTasks / proj.totalTasks) * 100)
                : 0;
              const members = proj.members || [];
              const visibleMembers = members.slice(0, 4);
              const extraMembers = members.length - visibleMembers.length;

              return (
                <div
                  key={proj.id}
                  className="project-card"
                  onClick={() => navigate(`/projects/${proj.id}`)}
                >
                  <div className="card-header">
                    <span className="badge-code">{proj.code}</span>
                    <span className="badge-status-modern">
                      <span className="status-dot" />
                      <span>{progress === 100 && proj.totalTasks > 0 ? 'Hoàn thành' : 'Đang hoạt động'}</span>
                    </span>
                  </div>

                  <h3 className="project-title">{proj.name}</h3>
                  <p className="project-desc">{proj.description || 'Chưa có mô tả cho dự án.'}</p>

                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Tiến độ hoàn thành</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="footer-left-group">
                      {visibleMembers.length > 0 && (
                        <div className="project-avatar-stack">
                          {visibleMembers.map((m) => (
                            <UserAvatar
                              key={m.userId}
                              name={m.fullName}
                              email={m.email}
                              avatarUrl={m.avatarUrl}
                              size="xs"
                              className="stacked-avatar"
                            />
                          ))}
                          {extraMembers > 0 && (
                            <span className="stacked-avatar-more">+{extraMembers}</span>
                          )}
                        </div>
                      )}
                      <div className="meta-item">
                        <CheckCircleOutlineOutlinedIcon style={{ fontSize: 15, color: '#10b981' }} />
                        <span>{proj.completedTasks}/{proj.totalTasks}</span>
                      </div>
                    </div>
                    <div className="footer-right-group">
                      <div className="meta-item">
                        <CalendarMonthOutlinedIcon style={{ fontSize: 14 }} />
                        <span>{new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <ArrowForwardIcon className="card-hover-arrow" style={{ fontSize: 16 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Khởi Tạo Dự Án Mới</h2>
            <p>Nhập thông tin cơ bản để bắt đầu phân chia công việc</p>

            {createError && (
              <div className="alert-error">
                <ErrorOutlineOutlinedIcon fontSize="small" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Tên dự án *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nâng cấp Cổng thông tin Khách hàng"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mã dự án (Project Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: PRJ, PORTAL, CRM"
                  value={newProject.code}
                  onChange={(e) => setNewProject({ ...newProject, code: e.target.value.toUpperCase() })}
                />
                <small>Mã này dùng để tự động đánh số công việc (vd: PRJ-1, PRJ-2)</small>
              </div>

              <div className="form-group">
                <label>Mô tả mục tiêu</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả phạm vi và mục tiêu chính của dự án..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
