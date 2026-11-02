import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ArrowLeft, Plus, CheckCircle2, Clock, AlertCircle, 
  MessageSquare, User, Calendar, Tag, ChevronRight, X 
} from 'lucide-react';

const COLUMNS = [
  { id: 1, title: 'Cần làm (Todo)', color: '#64748b' },
  { id: 2, title: 'Đang làm (In Progress)', color: '#2563eb' },
  { id: 3, title: 'Chờ duyệt (In Review)', color: '#eab308' },
  { id: 4, title: 'Hoàn thành (Done)', color: '#10b981' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal tạo công việc
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 2,
    dueDate: '',
    estimatedHours: ''
  });

  // Modal chi tiết & bình luận task
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dự án:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        projectId: id,
        title: newTask.title,
        description: newTask.description,
        priority: parseInt(newTask.priority),
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : null
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 2, dueDate: '', estimatedHours: '' });
      fetchProjectData();
    } catch (err) {
      alert('Không thể tạo công việc: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await api.put(`/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        assigneeId: task.assigneeId
      });

      // Cập nhật state cục bộ để UI phản hồi tức thì
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
    }
  };

  const handleOpenTaskDetail = async (taskId) => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setSelectedTask(res.data);
    } catch (err) {
      console.error('Lỗi tải chi tiết task:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    try {
      const res = await api.post(`/tasks/${selectedTask.id}/comments`, { content: commentText });
      setSelectedTask(prev => ({
        ...prev,
        comments: [...prev.comments, res.data]
      }));
      setCommentText('');
    } catch (err) {
      alert('Không thể gửi bình luận.');
    }
  };

  if (loading) {
    return <div className="loading-state">Đang tải bảng Kanban dự án...</div>;
  }

  if (!project) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-icon" />
        <h3>Không tìm thấy dự án</h3>
        <Link to="/" className="btn-primary">Về Không Gian Làm Việc</Link>
      </div>
    );
  }

  return (
    <div className="project-detail-layout">
      {/* Top Header */}
      <div className="project-header">
        <div className="header-left">
          <Link to="/" className="btn-back">
            <ArrowLeft size={18} />
            <span>Danh sách dự án</span>
          </Link>
          <div className="title-group">
            <span className="badge-code">{project.code}</span>
            <h2>{project.name}</h2>
          </div>
          <p className="project-desc">{project.description}</p>
        </div>
        <div className="header-right">
          <button onClick={() => setShowTaskModal(true)} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Công Việc</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="column-header" style={{ borderTopColor: col.color }}>
                <h3>{col.title}</h3>
                <span className="count-badge">{colTasks.length}</span>
              </div>

              <div className="task-list">
                {colTasks.length === 0 ? (
                  <div className="empty-column-placeholder">Chưa có công việc</div>
                ) : (
                  colTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="kanban-task-card"
                      onClick={() => handleOpenTaskDetail(task.id)}
                    >
                      <div className="task-card-top">
                        <span className="task-code">{task.taskCode}</span>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority === 4 ? 'Khẩn cấp' : task.priority === 3 ? 'Cao' : task.priority === 2 ? 'Trung bình' : 'Thấp'}
                        </span>
                      </div>

                      <h4>{task.title}</h4>

                      {task.dueDate && (
                        <div className="task-meta-due">
                          <Clock size={14} />
                          <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}

                      <div className="task-card-actions">
                        <select 
                          value={task.status} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateStatus(task.id, parseInt(e.target.value))}
                          className="status-dropdown"
                        >
                          {COLUMNS.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Thêm Task */}
      {showTaskModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Tạo Công Việc Mới</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Tiêu đề công việc *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ví dụ: Thiết kế giao diện đăng nhập"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea 
                  rows={3} 
                  placeholder="Chi tiết yêu cầu công việc..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Độ ưu tiên</label>
                  <select 
                    value={newTask.priority} 
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value={1}>Thấp</option>
                    <option value={2}>Trung bình</option>
                    <option value={3}>Cao</option>
                    <option value={4}>Khẩn cấp</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Hạn hoàn thành</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary">Tạo Công Việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Task & Thảo luận */}
      {selectedTask && (
        <div className="modal-backdrop">
          <div className="modal-card task-detail-modal">
            <div className="detail-modal-header">
              <div>
                <span className="task-code">{selectedTask.taskCode}</span>
                <h2>{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <p className="detail-desc">{selectedTask.description || 'Chưa có mô tả chi tiết.'}</p>

            {/* Comment Section */}
            <div className="comments-section">
              <h3><MessageSquare size={16} /> Thảo Luận & Ghi Chú ({selectedTask.comments?.length || 0})</h3>
              
              <div className="comments-list">
                {selectedTask.comments?.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-user">
                      <strong>{c.userFullName}</strong>
                      <span>{new Date(c.createdAt).toLocaleTimeString('vi-VN')} {new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="comment-body">{c.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="comment-form">
                <input 
                  type="text" 
                  placeholder="Viết bình luận, phản hồi công việc..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="btn-primary">Gửi</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
