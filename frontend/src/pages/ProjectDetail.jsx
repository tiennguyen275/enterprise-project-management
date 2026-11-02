import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const COLUMNS = [
  { id: 1, title: 'Cần làm (Todo)', color: '#64748b' },
  { id: 2, title: 'Đang làm (In Progress)', color: '#2563eb' },
  { id: 3, title: 'Chờ duyệt (In Review)', color: '#eab308' },
  { id: 4, title: 'Hoàn thành (Done)', color: '#10b981' },
];

export default function ProjectDetail() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'analytics' | 'notes'
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  // Modal tạo công việc
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 2,
    dueDate: '',
    estimatedHours: '',
    assigneeId: ''
  });

  // Modal mời thành viên
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState(3);
  const [memberError, setMemberError] = useState('');

  // Modal tạo biên bản cuộc họp
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    meetingDate: new Date().toISOString().substring(0, 10),
    attendees: '',
    content: '',
    actionItems: ''
  });

  // Modal chi tiết & bình luận task
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes, analyticsRes, notesRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/projects/${id}/analytics`),
        api.get(`/meetingnotes/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setAnalytics(analyticsRes.data);
      setNotes(notesRes.data);
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
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : null,
        assigneeId: newTask.assigneeId || null
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 2, dueDate: '', estimatedHours: '', assigneeId: '' });
      fetchProjectData();
    } catch (err) {
      alert('Không thể tạo công việc: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.status === newStatus) return;

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

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
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
      fetchProjectData();
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = async (e, colId) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleUpdateStatus(taskId, colId);
    }
    setDraggedTaskId(null);
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      await api.post(`/projects/${id}/members?email=${encodeURIComponent(memberEmail)}&role=${memberRole}`);
      setShowMemberModal(false);
      setMemberEmail('');
      fetchProjectData();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Không thể thêm thành viên.');
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      await api.post('/meetingnotes', {
        projectId: id,
        title: newNote.title,
        meetingDate: new Date(newNote.meetingDate).toISOString(),
        attendees: newNote.attendees,
        content: newNote.content,
        actionItems: newNote.actionItems
      });
      setShowNoteModal(false);
      setNewNote({
        title: '',
        meetingDate: new Date().toISOString().substring(0, 10),
        attendees: '',
        content: '',
        actionItems: ''
      });
      const notesRes = await api.get(`/meetingnotes/project/${id}`);
      setNotes(notesRes.data);
    } catch (err) {
      alert('Không thể lưu biên bản: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa biên bản cuộc họp này?')) return;
    try {
      await api.delete(`/meetingnotes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      alert('Không thể xóa biên bản.');
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
        <ErrorOutlineOutlinedIcon style={{ fontSize: 60, color: '#ef4444' }} />
        <h3>Không tìm thấy dự án</h3>
        <Link to="/" className="btn-primary">Về Không Gian Làm Việc</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Navigation */}
      <Navbar />

      <div className="project-detail-layout">
        {/* Top Header */}
        <div className="project-header">
          <div className="header-left">
            <Link to="/" className="btn-back">
              <ArrowBackIcon fontSize="small" />
              <span>Danh sách dự án</span>
            </Link>
            <div className="title-group">
              <span className="badge-code">{project.code}</span>
              <h2>{project.name}</h2>
            </div>
            <p className="project-desc">{project.description}</p>
          </div>
          <div className="header-right header-actions">
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary">
              <PersonAddAlt1OutlinedIcon fontSize="small" />
              <span>Mời Thành Viên ({project.members?.length || 1})</span>
            </button>
            <button onClick={() => setShowTaskModal(true)} className="btn-primary">
              <AddIcon fontSize="small" />
              <span>Thêm Công Việc</span>
            </button>
          </div>
        </div>

        {/* Tabs Switcher: Kanban vs Analytics vs Meeting Notes */}
        <div className="tabs-bar">
          <button 
            className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <ViewKanbanOutlinedIcon fontSize="small" />
            <span>Bảng Kanban (Kéo Thả)</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <DescriptionOutlinedIcon fontSize="small" />
            <span>Biên Bản Cuộc Họp ({notes.length})</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChartOutlinedIcon fontSize="small" />
            <span>Báo Cáo Phân Bổ (Analytics)</span>
          </button>
        </div>

        {/* Tab 1: Kanban Board với tính năng Kéo Thả (Drag and Drop) */}
        {activeTab === 'kanban' && (
          <div className="kanban-board">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              const isOver = dragOverColId === col.id;

              return (
                <div 
                  key={col.id} 
                  className={`kanban-column ${isOver ? 'column-drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={(e) => handleDragLeave(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="column-header" style={{ borderTopColor: col.color }}>
                    <h3>{col.title}</h3>
                    <span className="count-badge">{colTasks.length}</span>
                  </div>

                  <div className="task-list">
                    {colTasks.length === 0 ? (
                      <div className="empty-column-placeholder">
                        {isOver ? 'Thả công việc vào đây...' : 'Chưa có công việc'}
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <div 
                          key={task.id} 
                          className={`kanban-task-card ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
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
                              <AccessTimeIcon style={{ fontSize: 14 }} />
                              <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}

                          {task.assigneeName && (
                            <div className="task-meta-due" style={{ color: '#2563eb', fontWeight: 600 }}>
                              <PeopleAltOutlinedIcon style={{ fontSize: 14 }} />
                              <span>{task.assigneeName}</span>
                            </div>
                          )}

                          <div className="task-card-actions">
                            <span className="drag-hint"><DragIndicatorIcon style={{ fontSize: 14 }} /> Kéo thả hoặc chọn</span>
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
        )}

        {/* Tab 2: Meeting Notes */}
        {activeTab === 'notes' && (
          <div className="notes-layout">
            <div className="notes-header">
              <div>
                <h3>Nhật Ký & Biên Bản Cuộc Họp Dự Án</h3>
                <p>Lưu vết các quyết định quan trọng và phân công hành động (Action Items)</p>
              </div>
              <button onClick={() => setShowNoteModal(true)} className="btn-primary">
                <AddIcon fontSize="small" />
                <span>Ghi Biên Bản Mới</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state">
                <DescriptionOutlinedIcon style={{ fontSize: 60, color: '#94a3b8' }} />
                <h3>Chưa có biên bản cuộc họp nào</h3>
                <p>Lưu lại nội dung cuộc họp để cả nhóm cùng theo dõi</p>
                <button onClick={() => setShowNoteModal(true)} className="btn-primary">
                  <AddIcon fontSize="small" />
                  <span>Tạo Biên Bản Đầu Tiên</span>
                </button>
              </div>
            ) : (
              <div className="notes-grid">
                {notes.map(note => (
                  <div key={note.id} className="note-card">
                    <div className="note-card-header">
                      <h4>{note.title}</h4>
                      <button onClick={() => handleDeleteNote(note.id)} className="btn-delete" title="Xóa">
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </button>
                    </div>
                    <div className="note-meta">
                      <span><CalendarTodayOutlinedIcon style={{ fontSize: 14 }} /> {new Date(note.meetingDate).toLocaleDateString('vi-VN')}</span>
                      {note.attendees && <span><PeopleAltOutlinedIcon style={{ fontSize: 14 }} /> {note.attendees}</span>}
                    </div>
                    <div className="note-content">
                      <p>{note.content}</p>
                    </div>
                    {note.actionItems && (
                      <div className="note-action-items">
                        <strong>Hạng mục hành động:</strong>
                        <p>{note.actionItems}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics & Workload Distribution */}
        {activeTab === 'analytics' && analytics && (
          <div className="analytics-layout">
            <div className="stats-cards-grid">
              <div className="stat-card">
                <span className="stat-label">Tổng số công việc</span>
                <strong className="stat-value">{analytics.totalTasks}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Tỷ lệ hoàn thành</span>
                <strong className="stat-value text-success">{analytics.completionRate}%</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Đang thực hiện</span>
                <strong className="stat-value text-primary">{analytics.inProgressTasks}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Chờ duyệt</span>
                <strong className="stat-value text-warning">{analytics.inReviewTasks}</strong>
              </div>
            </div>

            <div className="analytics-card">
              <h3><PeopleAltOutlinedIcon fontSize="small" /> Thống Kê Phân Bổ Công Việc Theo Thành Viên (Workload Allocation)</h3>
              <p className="section-desc">Kế thừa chuẩn thuật toán thống kê AllocateTaskStatistic từ dự án Talgent</p>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Email</th>
                    <th>Công việc giao</th>
                    <th>Đã xong</th>
                    <th>Tỷ lệ phân bổ tải</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.memberAllocations?.map(m => (
                    <tr key={m.userId}>
                      <td><strong>{m.fullName}</strong></td>
                      <td>{m.email}</td>
                      <td>{m.totalTasks} task</td>
                      <td><span className="badge-done">{m.completedTasks} task</span></td>
                      <td>
                        <div className="allocation-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${m.allocationPercentage}%` }}></div>
                          </div>
                          <span>{m.allocationPercentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Mời Thành Viên */}
        {showMemberModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h2>Mời Thành Viên Vào Dự Án</h2>
              <p>Nhập email thành viên đã đăng ký tài khoản trên hệ thống</p>

              {memberError && (
                <div className="alert-error">
                  <ErrorOutlineOutlinedIcon fontSize="small" />
                  <span>{memberError}</span>
                </div>
              )}

              <form onSubmit={handleInviteMember}>
                <div className="form-group">
                  <label>Email thành viên *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="thanhvien@congty.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Vai trò dự án</label>
                  <select 
                    value={memberRole} 
                    onChange={(e) => setMemberRole(parseInt(e.target.value))}
                  >
                    <option value={2}>Quản lý dự án (Project Manager)</option>
                    <option value={3}>Thành viên thực hiện (Member)</option>
                    <option value={4}>Người xem / Khách (Viewer)</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary">Hủy</button>
                  <button type="submit" className="btn-primary">Thêm Thành Viên</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thêm Task (Có lựa chọn Người Thực Hiện) */}
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
                  <label>Người thực hiện (Assignee)</label>
                  <select 
                    value={newTask.assigneeId || ''} 
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                  >
                    <option value="">-- Chưa chỉ định (Unassigned) --</option>
                    {project.members?.map(m => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
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
    </div>
  );
}
