import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
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
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const COLUMNS = [
  { id: 1, title: 'Cần làm (Todo)', color: '#64748b' },
  { id: 2, title: 'Đang làm (In Progress)', color: '#2563eb' },
  { id: 3, title: 'Chờ duyệt (In Review)', color: '#eab308' },
  { id: 4, title: 'Hoàn thành (Done)', color: '#10b981' },
];

const HEALTH_LABELS = {
  1: 'Đúng tiến độ (On Track)',
  2: 'Có rủi ro (At Risk)',
  3: 'Chậm tiến độ (Delayed)',
};

export default function ProjectDetail() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState('kanban');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notes, setNotes] = useState([]);
  const [healthOverview, setHealthOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 2,
    dueDate: '',
    estimatedHours: '',
    assigneeId: ''
  });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState(3);
  const [memberError, setMemberError] = useState('');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState(() => ({
    title: '',
    meetingDate: new Date().toISOString().substring(0, 10),
    attendees: '',
    content: '',
    actionItems: ''
  }));

  const [timeframeFilter, setTimeframeFilter] = useState({ startDate: '', endDate: '' });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportError, setReportError] = useState('');
  const [needsOutOfRangeConfirm, setNeedsOutOfRangeConfirm] = useState(false);
  const [newReport, setNewReport] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      title: '',
      reportStartDate: weekAgo.toISOString().substring(0, 10),
      reportEndDate: today.toISOString().substring(0, 10),
      healthRating: 1,
      keyAccomplishments: '',
      upcomingPlan: '',
      risksAndBlockers: ''
    };
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (timeframeFilter.startDate) params.append('startDate', timeframeFilter.startDate);
      if (timeframeFilter.endDate) params.append('endDate', timeframeFilter.endDate);
      const healthQuery = params.toString() ? `?${params.toString()}` : '';

      const [projRes, tasksRes, analyticsRes, notesRes, healthRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/projects/${id}/analytics`),
        api.get(`/meetingnotes/project/${id}`),
        api.get(`/status-reports/project/${id}${healthQuery}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setAnalytics(analyticsRes.data);
      setNotes(notesRes.data);
      setHealthOverview(healthRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dự án:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthOverview = async (start, end) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/status-reports/project/${id}${query}`);
      setHealthOverview(res.data);
    } catch (err) {
      console.error('Lỗi tải báo cáo sức khỏe dự án:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
      api.get(`/projects/${id}/analytics`),
      api.get(`/meetingnotes/project/${id}`),
      api.get(`/status-reports/project/${id}`)
    ])
      .then(([projRes, tasksRes, analyticsRes, notesRes, healthRes]) => {
        if (isMounted) {
          setProject(projRes.data);
          setTasks(tasksRes.data);
          setAnalytics(analyticsRes.data);
          setNotes(notesRes.data);
          setHealthOverview(healthRes.data);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu dự án:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
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
      fetchHealthOverview(timeframeFilter.startDate, timeframeFilter.endDate);
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
      fetchProjectData();
    }
  };

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
      console.error('Lỗi xóa biên bản:', err);
      alert('Không thể xóa biên bản.');
    }
  };

  const handleTimeframeChange = (field, value) => {
    const updated = { ...timeframeFilter, [field]: value };
    setTimeframeFilter(updated);
    fetchHealthOverview(updated.startDate, updated.endDate);
  };

  const handleOpenReportModal = () => {
    setReportError('');
    setNeedsOutOfRangeConfirm(false);
    setNewReport(prev => ({
      ...prev,
      healthRating: healthOverview?.suggestedRating || 1
    }));
    setShowReportModal(true);
  };

  const submitStatusReport = async (skipWarning) => {
    setReportError('');
    try {
      await api.post('/status-reports', {
        projectId: id,
        title: newReport.title,
        reportStartDate: new Date(newReport.reportStartDate).toISOString(),
        reportEndDate: new Date(newReport.reportEndDate).toISOString(),
        healthRating: parseInt(newReport.healthRating),
        keyAccomplishments: newReport.keyAccomplishments,
        upcomingPlan: newReport.upcomingPlan,
        risksAndBlockers: newReport.risksAndBlockers,
        skipOutOfRangeWarning: skipWarning
      });
      setShowReportModal(false);
      setNeedsOutOfRangeConfirm(false);
      setNewReport(prev => ({
        ...prev,
        title: '',
        keyAccomplishments: '',
        upcomingPlan: '',
        risksAndBlockers: ''
      }));
      fetchHealthOverview(timeframeFilter.startDate, timeframeFilter.endDate);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể lưu báo cáo trạng thái.';
      if (msg.includes('HAVE_TASK_OUT_OF_RANGE')) {
        setNeedsOutOfRangeConfirm(true);
        setReportError('Phát hiện có công việc được tạo ngoài khoảng thời gian kỳ báo cáo đã chọn. Bạn có muốn tiếp tục lưu báo cáo không?');
      } else {
        setReportError(msg);
      }
    }
  };

  const handleCreateReport = (e) => {
    e.preventDefault();
    submitStatusReport(needsOutOfRangeConfirm);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo trạng thái này?')) return;
    try {
      await api.delete(`/status-reports/${reportId}`);
      fetchHealthOverview(timeframeFilter.startDate, timeframeFilter.endDate);
    } catch (err) {
      console.error('Lỗi xóa báo cáo:', err);
      alert('Không thể xóa báo cáo trạng thái.');
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
      console.error('Lỗi gửi bình luận:', err);
      alert('Không thể gửi bình luận.');
    }
  };

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu dự án...</div>;
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
      <Navbar />

      <div className="project-detail-layout">
        <div className="project-header">
          <div className="header-left">
            <Link to="/" className="btn-back">
              <ArrowBackIcon fontSize="small" />
              <span>Danh sách dự án</span>
            </Link>
            <div className="title-group">
              <span className="badge-code">{project.code}</span>
              <h2>{project.name}</h2>
              {healthOverview && (
                <span className={`health-badge rating-${healthOverview.suggestedRating}`}>
                  {healthOverview.suggestedRating === 1 ? (
                    <CheckCircleOutlineIcon style={{ fontSize: 15 }} />
                  ) : (
                    <WarningAmberOutlinedIcon style={{ fontSize: 15 }} />
                  )}
                  <span>{HEALTH_LABELS[healthOverview.suggestedRating]}</span>
                </span>
              )}
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

        <div className="tabs-bar">
          <button 
            className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <ViewKanbanOutlinedIcon fontSize="small" />
            <span>Bảng Kanban (Kéo Thả)</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'status-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('status-reports')}
          >
            <AssessmentOutlinedIcon fontSize="small" />
            <span>Báo Cáo Sức Khỏe ({healthOverview?.reports?.length || 0})</span>
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
                          className={`kanban-task-card priority-border-${task.priority} ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
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

        {activeTab === 'status-reports' && healthOverview && (
          <div className="status-reports-layout">
            <div className={`health-overview-banner health-rating-${healthOverview.suggestedRating}`}>
              <div className="health-banner-left">
                <div className="health-status-row">
                  <h3>Chẩn Đoán Sức Khỏe Dự Án (R/A/G Health Check)</h3>
                  <span className={`health-badge rating-${healthOverview.suggestedRating}`}>
                    {HEALTH_LABELS[healthOverview.suggestedRating]}
                  </span>
                </div>
                <p>{healthOverview.healthSummary}</p>
              </div>

              <div className="health-banner-metrics">
                <div className="metric-pill success">
                  <span>Tiến độ chung</span>
                  <strong>{healthOverview.completionRate}%</strong>
                </div>
                <div className="metric-pill">
                  <span>Đã hoàn thành</span>
                  <strong>{healthOverview.completedTasks}/{healthOverview.totalTasks}</strong>
                </div>
                <div className={`metric-pill ${healthOverview.overdueTasks > 0 ? 'danger' : ''}`}>
                  <span>Việc quá hạn</span>
                  <strong>{healthOverview.overdueTasks}</strong>
                </div>
                <button onClick={handleOpenReportModal} className="btn-primary">
                  <AddIcon fontSize="small" />
                  <span>Lập Báo Cáo Kỳ Này</span>
                </button>
              </div>
            </div>

            <div className="status-timeframe-bar">
              <div className="timeframe-inputs">
                <label>Kiểm tra khung thời gian báo cáo:</label>
                <input
                  type="date"
                  value={timeframeFilter.startDate}
                  onChange={(e) => handleTimeframeChange('startDate', e.target.value)}
                />
                <span>đến</span>
                <input
                  type="date"
                  value={timeframeFilter.endDate}
                  onChange={(e) => handleTimeframeChange('endDate', e.target.value)}
                />
                {(timeframeFilter.startDate || timeframeFilter.endDate) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setTimeframeFilter({ startDate: '', endDate: '' });
                      fetchHealthOverview('', '');
                    }}
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              {healthOverview.outOfRangeTasks > 0 && (
                <div className="out-of-range-notice">
                  <WarningAmberOutlinedIcon fontSize="small" />
                  <span>Có {healthOverview.outOfRangeTasks} công việc tạo ngoài khung thời gian này</span>
                </div>
              )}
            </div>

            {healthOverview.reports?.length === 0 ? (
              <div className="empty-state">
                <AssessmentOutlinedIcon style={{ fontSize: 60, color: '#94a3b8' }} />
                <h3>Chưa có báo cáo trạng thái định kỳ nào</h3>
                <p>Lập báo cáo định kỳ để lưu lại tiến độ, kết quả đạt được và các rủi ro cần xử lý của dự án</p>
                <button onClick={handleOpenReportModal} className="btn-primary">
                  <AddIcon fontSize="small" />
                  <span>Tạo Báo Cáo Trạng Thái Đầu Tiên</span>
                </button>
              </div>
            ) : (
              <div className="status-reports-grid">
                {healthOverview.reports.map(report => (
                  <div key={report.id} className={`status-report-card rating-border-${report.healthRating}`}>
                    <div className="report-card-header">
                      <div>
                        <span className={`health-badge rating-${report.healthRating}`}>
                          {HEALTH_LABELS[report.healthRating]}
                        </span>
                        <h4 style={{ marginTop: 8 }}>{report.title}</h4>
                      </div>
                      <button onClick={() => handleDeleteReport(report.id)} className="btn-delete" title="Xóa báo cáo">
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </button>
                    </div>

                    <div className="report-meta-row">
                      <span>
                        <CalendarTodayOutlinedIcon style={{ fontSize: 14 }} />
                        Kỳ: {new Date(report.reportStartDate).toLocaleDateString('vi-VN')} - {new Date(report.reportEndDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span>Người lập: <strong>{report.authorName}</strong></span>
                    </div>

                    <div className="report-snapshot-bar">
                      <div className="snap-item">
                        <span>Tiến độ lúc lập</span>
                        <strong>{report.completionRateSnapshot}%</strong>
                      </div>
                      <div className="snap-item">
                        <span>Hoàn thành</span>
                        <strong>{report.completedTasksSnapshot}/{report.totalTasksSnapshot} task</strong>
                      </div>
                      <div className="snap-item">
                        <span>Quá hạn</span>
                        <strong style={{ color: report.overdueTasksSnapshot > 0 ? '#ef4444' : '#0f172a' }}>
                          {report.overdueTasksSnapshot} task
                        </strong>
                      </div>
                    </div>

                    <div className="report-section">
                      <strong>Kết quả đạt được trong kỳ:</strong>
                      <p>{report.keyAccomplishments}</p>
                    </div>

                    {report.upcomingPlan && (
                      <div className="report-section">
                        <strong>Kế hoạch kỳ tiếp theo:</strong>
                        <p>{report.upcomingPlan}</p>
                      </div>
                    )}

                    {report.risksAndBlockers && (
                      <div className="report-section risk-box">
                        <strong>Rủi ro & Vướng mắc cần tháo gỡ:</strong>
                        <p>{report.risksAndBlockers}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
              <p className="section-desc">Theo dõi tỷ lệ phân bổ khối lượng công việc và tiến độ hoàn thành của từng thành viên trong dự án</p>

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

        {showReportModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h2>Lập Báo Cáo Trạng Thái & Sức Khỏe Dự Án</h2>
              <p>Ghi nhận đánh giá R/A/G và tự động lưu snapshot số liệu tiến độ hiện tại</p>

              {reportError && (
                <div className="alert-error">
                  <ErrorOutlineOutlinedIcon fontSize="small" />
                  <span>{reportError}</span>
                </div>
              )}

              <form onSubmit={handleCreateReport}>
                <div className="form-group">
                  <label>Tiêu đề kỳ báo cáo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Báo cáo tiến độ Sprint 3 - Tuần 1 Tháng 11"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Từ ngày *</label>
                    <input
                      type="date"
                      required
                      value={newReport.reportStartDate}
                      onChange={(e) => {
                        setNeedsOutOfRangeConfirm(false);
                        setReportError('');
                        setNewReport({ ...newReport, reportStartDate: e.target.value });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Đến ngày *</label>
                    <input
                      type="date"
                      required
                      value={newReport.reportEndDate}
                      onChange={(e) => {
                        setNeedsOutOfRangeConfirm(false);
                        setReportError('');
                        setNewReport({ ...newReport, reportEndDate: e.target.value });
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Đánh giá sức khỏe dự án (R/A/G Rating)</label>
                  <select
                    value={newReport.healthRating}
                    onChange={(e) => setNewReport({ ...newReport, healthRating: parseInt(e.target.value) })}
                  >
                    <option value={1}>Xanh - Đúng tiến độ (On Track)</option>
                    <option value={2}>Vàng - Có rủi ro cần lưu ý (At Risk)</option>
                    <option value={3}>Đỏ - Chậm tiến độ / Nguy cấp (Delayed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Kết quả đạt được trong kỳ *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Các hạng mục, tính năng hoặc mục tiêu đã hoàn thành..."
                    value={newReport.keyAccomplishments}
                    onChange={(e) => setNewReport({ ...newReport, keyAccomplishments: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Kế hoạch trọng tâm kỳ tiếp theo</label>
                  <textarea
                    rows={2}
                    placeholder="Các đầu việc ưu tiên triển khai trong tuần tới..."
                    value={newReport.upcomingPlan}
                    onChange={(e) => setNewReport({ ...newReport, upcomingPlan: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Rủi ro & Vướng mắc (Risks / Blockers)</label>
                  <textarea
                    rows={2}
                    placeholder="Các vấn đề kỹ thuật, nhân sự hoặc phụ thuộc cần hỗ trợ..."
                    value={newReport.risksAndBlockers}
                    onChange={(e) => setNewReport({ ...newReport, risksAndBlockers: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowReportModal(false)} className="btn-secondary">Hủy</button>
                  <button type="submit" className="btn-primary">
                    {needsOutOfRangeConfirm ? 'Xác Nhận Lưu (Bỏ Qua Cảnh Báo)' : 'Lưu Báo Cáo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

        {showNoteModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h2>Ghi Biên Bản Cuộc Họp</h2>
              <p>Lưu lại nội dung trao đổi, kết luận và phân công sau buổi họp</p>

              <form onSubmit={handleCreateNote}>
                <div className="form-group">
                  <label>Chủ đề cuộc họp *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ví dụ: Họp Sprint Review tuần 42"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày họp</label>
                    <input 
                      type="date" 
                      required
                      value={newNote.meetingDate}
                      onChange={(e) => setNewNote({ ...newNote, meetingDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Người tham dự</label>
                    <input 
                      type="text" 
                      placeholder="Tiến, Minh, Hương..."
                      value={newNote.attendees}
                      onChange={(e) => setNewNote({ ...newNote, attendees: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nội dung thảo luận & Quyết định *</label>
                  <textarea 
                    rows={4} 
                    required
                    placeholder="Tóm tắt các vấn đề đã bàn bạc và thống nhất..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hạng mục hành động (Action Items)</label>
                  <textarea 
                    rows={2} 
                    placeholder="Ai làm gì, deadline khi nào..."
                    value={newNote.actionItems}
                    onChange={(e) => setNewNote({ ...newNote, actionItems: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowNoteModal(false)} className="btn-secondary">Hủy</button>
                  <button type="submit" className="btn-primary">Lưu Biên Bản</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
