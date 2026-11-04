import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

// MUI Icons
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';

const STATUS_OPTIONS = [
  { id: 1, title: 'Cần làm (Todo)', color: '#64748b' },
  { id: 2, title: 'Đang làm (In Progress)', color: '#2563eb' },
  { id: 3, title: 'Chờ duyệt (In Review)', color: '#d97706' },
  { id: 4, title: 'Hoàn thành (Done)', color: '#10b981' },
];

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // all | today | overdue | in_progress | completed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  // Task detail & discussion modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/my-tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Lỗi tải công việc cá nhân:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      await api.put(`/tasks/${taskId}`, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        status: newStatus,
        priority: taskToUpdate.priority,
        dueDate: taskToUpdate.dueDate,
        estimatedHours: taskToUpdate.estimatedHours,
        actualHours: taskToUpdate.actualHours,
        assigneeId: taskToUpdate.assigneeId
      });

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert('Không thể cập nhật trạng thái công việc.');
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
      // Cập nhật lại số lượng comment trên danh sách
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, commentCount: t.commentCount + 1 } : t));
    } catch (err) {
      alert('Không thể gửi bình luận.');
    }
  };

  // KPIs
  const todayStr = new Date().toISOString().substring(0, 10);
  const totalCount = tasks.length;
  const overdueCount = tasks.filter(t => t.isOverdue).length;
  const todayCount = tasks.filter(t => t.dueDate && t.dueDate.substring(0, 10) === todayStr && t.status !== 4).length;
  const inProgressCount = tasks.filter(t => t.status === 2).length;
  const completedCount = tasks.filter(t => t.status === 4).length;

  // Lấy danh sách dự án duy nhất để lọc
  const uniqueProjects = Array.from(
    new Map(tasks.map(t => [t.projectId, { id: t.projectId, name: t.projectName, code: t.projectCode }])).values()
  );

  // Lọc dữ liệu
  const filteredTasks = tasks.filter(task => {
    // Lọc theo tab
    if (filterTab === 'today') {
      if (!task.dueDate || task.dueDate.substring(0, 10) !== todayStr || task.status === 4) return false;
    } else if (filterTab === 'overdue') {
      if (!task.isOverdue) return false;
    } else if (filterTab === 'in_progress') {
      if (task.status !== 2) return false;
    } else if (filterTab === 'completed') {
      if (task.status !== 4) return false;
    }

    // Lọc theo dự án
    if (selectedProject !== 'all' && task.projectId !== selectedProject) {
      return false;
    }

    // Lọc theo tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCode = task.taskCode.toLowerCase().includes(q);
      const matchProject = task.projectName.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchProject) return false;
    }

    return true;
  });

  return (
    <div className="my-tasks-layout">
      {/* Navbar chung */}
      <Navbar />

      <main className="main-content">
        {/* Content Header */}
        <div className="content-header">
          <div>
            <h1>Không Gian Cá Nhân (My Tasks)</h1>
            <p>Theo dõi và xử lý các công việc được giao trên toàn bộ hệ thống dự án doanh nghiệp</p>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="my-tasks-kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon icon-blue">
              <AssignmentOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Tổng việc được giao</span>
              <strong className="kpi-value">{totalCount}</strong>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon icon-red">
              <WarningAmberOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Quá hạn (Overdue)</span>
              <strong className="kpi-value text-danger">{overdueCount}</strong>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon icon-yellow">
              <TodayOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Đến hạn hôm nay</span>
              <strong className="kpi-value text-warning">{todayCount}</strong>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon icon-green">
              <CheckCircleOutlineOutlinedIcon />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Đã hoàn thành</span>
              <strong className="kpi-value text-success">{completedCount}</strong>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="my-tasks-toolbar">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              Tất cả ({totalCount})
            </button>
            <button 
              className={`filter-tab ${filterTab === 'today' ? 'active' : ''}`}
              onClick={() => setFilterTab('today')}
            >
              Hôm nay ({todayCount})
            </button>
            <button 
              className={`filter-tab ${filterTab === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilterTab('overdue')}
            >
              Quá hạn ({overdueCount})
            </button>
            <button 
              className={`filter-tab ${filterTab === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilterTab('in_progress')}
            >
              Đang làm ({inProgressCount})
            </button>
            <button 
              className={`filter-tab ${filterTab === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterTab('completed')}
            >
              Đã xong ({completedCount})
            </button>
          </div>

          <div className="search-filter-group">
            <div className="search-box">
              <SearchIcon fontSize="small" className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm mã hoặc tên công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="project-select-box">
              <FilterListIcon fontSize="small" className="select-icon" />
              <select 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="all">Tất cả dự án</option>
                {uniqueProjects.map(p => (
                  <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Task List Table / Cards */}
        {loading ? (
          <div className="loading-state">Đang tải danh sách công việc cá nhân...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <AssignmentOutlinedIcon style={{ fontSize: 60, color: '#94a3b8' }} />
            <h3>Không có công việc nào trong danh mục này</h3>
            <p>Các công việc được phân công cho bạn hoặc do bạn tạo sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="my-tasks-list">
            {filteredTasks.map(task => {
              const priorityText = task.priority === 4 ? 'Khẩn cấp' : task.priority === 3 ? 'Cao' : task.priority === 2 ? 'Trung bình' : 'Thấp';
              return (
                <div 
                  key={task.id} 
                  className={`my-task-row priority-border-${task.priority} ${task.isOverdue ? 'row-overdue' : ''} ${task.status === 4 ? 'row-done' : ''}`}
                >
                  <div className="task-row-main" onClick={() => handleOpenTaskDetail(task.id)}>
                    <div className="task-meta-top">
                      <span className="badge-code">{task.projectCode}</span>
                      <span className="project-name-tag">{task.projectName}</span>
                      <span className="task-code-tag">{task.taskCode}</span>
                      <span className={`priority-badge priority-${task.priority}`}>
                        {priorityText}
                      </span>
                      {task.isOverdue && (
                        <span className="badge-overdue">
                          <WarningAmberOutlinedIcon style={{ fontSize: 13 }} /> Quá hạn
                        </span>
                      )}
                    </div>

                    <h3 className="task-row-title">{task.title}</h3>

                    {task.description && (
                      <p className="task-row-desc">{task.description}</p>
                    )}

                    <div className="task-meta-bottom">
                      {task.dueDate && (
                        <span className={`due-date-tag ${task.isOverdue ? 'text-danger font-bold' : ''}`}>
                          <AccessTimeIcon style={{ fontSize: 14 }} />
                          Hạn chót: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      <span className="comments-tag">
                        <ChatBubbleOutlineOutlinedIcon style={{ fontSize: 14 }} />
                        {task.commentCount} thảo luận
                      </span>
                    </div>
                  </div>

                  <div className="task-row-actions">
                    <label>Trạng thái</label>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, parseInt(e.target.value))}
                      className={`status-select status-${task.status}`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <p className="detail-desc">{selectedTask.description || 'Chưa có mô tả chi tiết.'}</p>

            <div className="comments-section">
              <h3><ChatBubbleOutlineOutlinedIcon fontSize="small" /> Thảo Luận & Ghi Chú ({selectedTask.comments?.length || 0})</h3>
              
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
