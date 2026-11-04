import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Không Gian Làm Việc</h1>
            <p>Theo dõi tiến độ và các dự án doanh nghiệp của bạn</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <AddIcon fontSize="small" />
            <span>Tạo Dự Án Mới</span>
          </button>
        </div>

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
        ) : (
          <div className="projects-grid">
            {projects.map((proj) => {
              const progress = proj.totalTasks > 0 
                ? Math.round((proj.completedTasks / proj.totalTasks) * 100) 
                : 0;

              return (
                <div 
                  key={proj.id} 
                  className="project-card"
                  onClick={() => navigate(`/projects/${proj.id}`)}
                >
                  <div className="card-header">
                    <span className="badge-code">{proj.code}</span>
                    <span className="badge-status">Đang hoạt động</span>
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
                    <div className="meta-item">
                      <CheckCircleOutlineOutlinedIcon fontSize="small" style={{ color: '#10b981' }} />
                      <span>{proj.completedTasks}/{proj.totalTasks} công việc</span>
                    </div>
                    <div className="meta-item">
                      <CalendarMonthOutlinedIcon fontSize="small" />
                      <span>{new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>
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
