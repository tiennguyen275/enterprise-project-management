import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FolderGit2, CheckCircle2, Clock, Plus, LogOut, 
  Search, AlertCircle, Calendar, Users
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', code: '', description: '' });
  const [createError, setCreateError] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách dự án:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/projects', newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', code: '', description: '' });
      fetchProjects();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Không thể tạo dự án.');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="navbar">
        <div className="nav-brand">
          <FolderGit2 className="brand-icon" />
          <span>Enterprise Project Manager</span>
        </div>
        <div className="nav-user">
          <span className="user-greeting">Xin chào, <strong>{user?.fullName}</strong></span>
          <button onClick={logout} className="btn-logout" title="Đăng xuất">
            <LogOut size={18} />
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Không Gian Làm Việc</h1>
            <p>Theo dõi tiến độ và các dự án doanh nghiệp của bạn</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={18} />
            <span>Tạo Dự Án Mới</span>
          </button>
        </div>

        {/* Project Cards Grid */}
        {loading ? (
          <div className="loading-state">Đang tải dữ liệu dự án...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderGit2 size={48} className="empty-icon" />
            <h3>Chưa có dự án nào</h3>
            <p>Bắt đầu ngay bằng việc tạo dự án đầu tiên của bạn</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus size={18} />
              <span>Tạo Dự Án</span>
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((proj) => {
              const progress = proj.totalTasks > 0 
                ? Math.round((proj.completedTasks / proj.totalTasks) * 100) 
                : 0;

              return (
                <div key={proj.id} className="project-card">
                  <div className="card-top">
                    <span className="badge-code">{proj.code}</span>
                    <span className={`badge-status status-${proj.status}`}>
                      {proj.status === 2 ? 'Đang hoạt động' : 'Kế hoạch'}
                    </span>
                  </div>

                  <h3>{proj.name}</h3>
                  <p className="card-desc">{proj.description || 'Không có mô tả chi tiết.'}</p>

                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Tiến độ hoàn thành</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="task-stats">
                      <CheckCircle2 size={16} />
                      <span>{proj.completedTasks}/{proj.totalTasks} công việc</span>
                    </div>
                    <div className="date-info">
                      <Calendar size={16} />
                      <span>{new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Tạo Dự Án */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Khởi Tạo Dự Án Mới</h2>
            <p>Nhập thông tin cơ bản để bắt đầu phân chia công việc</p>

            {createError && (
              <div className="alert-error">
                <AlertCircle size={18} />
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
