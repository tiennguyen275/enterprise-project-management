import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createProjectHubConnection } from '../../services/signalr';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import UserAvatar from '../../components/common/UserAvatar';
import AssigneeSelect from '../../components/common/AssigneeSelect';
import KanbanTab from '../../components/projects/KanbanTab';
import CpmGanttTab from '../../components/projects/CpmGanttTab';
import ProjectChatTab from '../../components/projects/ProjectChatTab';
import HealthReportsTab from '../../components/projects/HealthReportsTab';
import MeetingNotesTab from '../../components/projects/MeetingNotesTab';
import AnalyticsAuditTab from '../../components/projects/AnalyticsAuditTab';
import TaskDetailModal from '../../components/projects/TaskDetailModal';
import ProjectSettingsModal from '../../components/projects/ProjectSettingsModal';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTaskId = searchParams.get('taskId');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [activeTab, setActiveTab] = useState('kanban');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notes, setNotes] = useState([]);
  const [healthOverview, setHealthOverview] = useState(null);
  const [activities, setActivities] = useState([]);
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

  const [kanbanSearch, setKanbanSearch] = useState('');
  const [kanbanAssignee, setKanbanAssignee] = useState('ALL');
  const [kanbanPriority, setKanbanPriority] = useState('ALL');

  const [selectedTask, setSelectedTask] = useState(null);
  const selectedTaskRef = useRef(null);
  const patchQueueRef = useRef(Promise.resolve());
  const [taskEditForm, setTaskEditForm] = useState({
    title: '',
    description: '',
    status: 1,
    priority: 2,
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    assigneeId: ''
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [aiInsight, setAiInsight] = useState(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState('');
  const [subtaskSuggestions, setSubtaskSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const { user: currentUser } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const chatBottomRef = useRef(null);
  const aiThinkingTimerRef = useRef(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [newDep, setNewDep] = useState({ predecessorTaskId: '', successorTaskId: '', lagDays: 0 });
  const [depError, setDepError] = useState('');

  const fetchProjectData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (timeframeFilter.startDate) params.append('startDate', timeframeFilter.startDate);
      if (timeframeFilter.endDate) params.append('endDate', timeframeFilter.endDate);
      const healthQuery = params.toString() ? `?${params.toString()}` : '';

      const [projRes, tasksRes, analyticsRes, notesRes, healthRes, scheduleRes, activitiesRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/projects/${id}/analytics`),
        api.get(`/meetingnotes/project/${id}`),
        api.get(`/status-reports/project/${id}${healthQuery}`),
        api.get(`/projects/${id}/schedule`),
        api.get(`/projects/${id}/activities`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setAnalytics(analyticsRes.data);
      setNotes(notesRes.data);
      setHealthOverview(healthRes.data);
      if (scheduleRes) setScheduleData(scheduleRes.data);
      if (activitiesRes) setActivities(activitiesRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dự án:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e, forceAskAi = false, directText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = directText || chatInput;
    if (!textToSend || !textToSend.trim() || chatSending) return;

    const lower = textToSend.toLowerCase();
    const isAskingAi = forceAskAi || lower.includes('@ai') || lower.startsWith('/ai');

    if (!directText) {
      setChatInput('');
    }
    setChatSending(true);
    if (isAskingAi) {
      setAiThinking(true);
      if (aiThinkingTimerRef.current) clearTimeout(aiThinkingTimerRef.current);
      aiThinkingTimerRef.current = setTimeout(() => {
        setAiThinking(false);
      }, 25000);
    }
    try {
      const res = await api.post(`/projects/${id}/messages`, {
        content: textToSend.trim(),
        askAi: isAskingAi,
      });
      if (res.data) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error('Loi gui tin nhan:', err);
      setAiThinking(false);
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    api.get(`/projects/${id}/messages`)
      .then((res) => {
        setChatMessages(res.data || []);
      })
      .catch((err) => {
        console.error('Loi tai tin nhan du an:', err);
      })
      .finally(() => {
        setChatLoading(false);
      });

    const hub = createProjectHubConnection(id, {
      onProjectMessage: (message) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (message.isAiGenerated) {
          setAiThinking(false);
          if (aiThinkingTimerRef.current) clearTimeout(aiThinkingTimerRef.current);
        } else if (
          message.content &&
          (message.content.toLowerCase().includes('@ai') || message.content.toLowerCase().startsWith('/ai'))
        ) {
          setAiThinking(true);
          if (aiThinkingTimerRef.current) clearTimeout(aiThinkingTimerRef.current);
          aiThinkingTimerRef.current = setTimeout(() => {
            setAiThinking(false);
          }, 25000);
        }
      },
      onTaskUpdate: ({ task, action }) => {
        if (!task || task.parentTaskId) return;
        if (action === 'deleted') {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          setSelectedTask((prev) => (prev && prev.id === task.id ? null : prev));
          return;
        }
        if (action === 'created') {
          setTasks((prev) => {
            if (prev.some((t) => t.id === task.id)) return prev;
            return [task, ...prev];
          });
        } else {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === task.id);
            if (!exists) return [task, ...prev];
            return prev.map((t) => (t.id === task.id ? { ...t, ...task } : t));
          });
        }
        setSelectedTask((prev) => (prev && prev.id === task.id ? { ...prev, ...task } : prev));
      },
      onProjectDataChanged: () => {
        api.get(`/tasks/project/${id}`)
          .then((res) => setTasks(res.data))
          .catch(() => {});
      },
      onConnectionChange: (connected) => {
        setSignalRConnected(connected);
      },
    });

    return () => {
      hub.stop();
    };
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, aiThinking, activeTab]);

  useEffect(() => {
    return () => {
      if (aiThinkingTimerRef.current) clearTimeout(aiThinkingTimerRef.current);
    };
  }, []);

  const fetchScheduleData = async () => {
    try {
      setScheduleLoading(true);
      const res = await api.get(`/projects/${id}/schedule`);
      setScheduleData(res.data);
    } catch (err) {
      console.error('Loi tai du lieu duong gang CPM:', err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleAddDependency = async (e) => {
    e.preventDefault();
    setDepError('');
    if (!newDep.predecessorTaskId || !newDep.successorTaskId) {
      setDepError('Vui lòng chọn cả công việc trước và công việc sau.');
      return;
    }
    if (newDep.predecessorTaskId === newDep.successorTaskId) {
      setDepError('Công việc không thể phụ thuộc vào chính nó.');
      return;
    }
    try {
      await api.post(`/projects/${id}/dependencies`, {
        predecessorTaskId: newDep.predecessorTaskId,
        successorTaskId: newDep.successorTaskId,
        lagDays: parseInt(newDep.lagDays || 0, 10),
      });
      setShowDependencyModal(false);
      setNewDep({ predecessorTaskId: '', successorTaskId: '', lagDays: 0 });
      fetchScheduleData();
    } catch (err) {
      setDepError(err.response?.data?.message || 'Lỗi thêm ràng buộc công việc.');
    }
  };

  const handleDeleteDependency = async (depId) => {
    try {
      await api.delete(`/projects/${id}/dependencies/${depId}`);
      fetchScheduleData();
    } catch (err) {
      console.error('Loi xoa rang buoc:', err);
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
      api.get(`/status-reports/project/${id}`),
      api.get(`/projects/${id}/schedule`),
      api.get(`/projects/${id}/activities`)
    ])
      .then(([projRes, tasksRes, analyticsRes, notesRes, healthRes, scheduleRes, activitiesRes]) => {
        if (isMounted) {
          setProject(projRes.data);
          setTasks(tasksRes.data);
          setAnalytics(analyticsRes.data);
          setNotes(notesRes.data);
          setHealthOverview(healthRes.data);
          if (scheduleRes) {
            setScheduleData(scheduleRes.data);
          }
          if (activitiesRes) {
            setActivities(activitiesRes.data || []);
          }
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

  const syncTaskEditForm = (taskData) => {
    setTaskEditForm({
      title: taskData.title || '',
      description: taskData.description || '',
      status: taskData.status || 1,
      priority: taskData.priority || 2,
      dueDate: taskData.dueDate ? taskData.dueDate.substring(0, 10) : '',
      estimatedHours: taskData.estimatedHours ?? '',
      actualHours: taskData.actualHours ?? '',
      assigneeId: taskData.assigneeId || ''
    });
  };

  useEffect(() => {
    if (!requestedTaskId) return undefined;
    let isMounted = true;
    api.get(`/tasks/${requestedTaskId}`)
      .then((res) => {
        if (!isMounted || !res.data) return;
        setNewSubtaskTitle('');
        setSubtaskSuggestions([]);
        setSuggestionError('');
        setAssigneeSuggestions([]);
        setSelectedTask(res.data);
        syncTaskEditForm(res.data);
        setSearchParams({}, { replace: true });
      })
      .catch((err) => {
        console.error('Lỗi tải chi tiết công việc từ tìm kiếm:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [requestedTaskId, setSearchParams]);

  const handleOpenTaskDetail = async (taskId) => {
    try {
      setNewSubtaskTitle('');
      setSubtaskSuggestions([]);
      setSuggestionError('');
      setAssigneeSuggestions([]);
      const res = await api.get(`/tasks/${taskId}`);
      setSelectedTask(res.data);
      syncTaskEditForm(res.data);
    } catch (err) {
      console.error('Lỗi tải chi tiết task:', err);
    }
  };

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  const handlePatchTask = (patch) => {
    const targetTaskId = selectedTaskRef.current?.id;
    if (!targetTaskId) return Promise.resolve(null);

    const runPatch = async () => {
      const base = selectedTaskRef.current;
      if (!base || base.id !== targetTaskId) return null;
      const payload = {
        title: patch.title !== undefined ? patch.title : base.title,
        description: patch.description !== undefined ? patch.description : (base.description || ''),
        status: patch.status !== undefined ? parseInt(patch.status, 10) : base.status,
        priority: patch.priority !== undefined ? parseInt(patch.priority, 10) : base.priority,
        dueDate: patch.dueDate !== undefined
          ? (patch.dueDate ? new Date(patch.dueDate).toISOString() : null)
          : (base.dueDate || null),
        estimatedHours: patch.estimatedHours !== undefined
          ? (patch.estimatedHours !== '' && patch.estimatedHours !== null ? parseFloat(patch.estimatedHours) : null)
          : (base.estimatedHours ?? null),
        actualHours: patch.actualHours !== undefined
          ? (patch.actualHours !== '' && patch.actualHours !== null ? parseFloat(patch.actualHours) : null)
          : (base.actualHours ?? null),
        assigneeId: patch.assigneeId !== undefined
          ? (patch.assigneeId || null)
          : (base.assigneeId || null),
      };
      const res = await api.put(`/tasks/${targetTaskId}`, payload);
      setTasks((prev) => prev.map((t) => (t.id === targetTaskId ? { ...t, ...res.data } : t)));
      if (selectedTaskRef.current?.id === targetTaskId) {
        selectedTaskRef.current = res.data;
        setSelectedTask(res.data);
        setTaskEditForm((prev) => ({
          ...prev,
          ...(patch.title !== undefined ? { title: res.data.title || '' } : {}),
          ...(patch.description !== undefined ? { description: res.data.description || '' } : {}),
          ...(patch.status !== undefined ? { status: res.data.status || 1 } : {}),
          ...(patch.priority !== undefined ? { priority: res.data.priority || 2 } : {}),
          ...(patch.dueDate !== undefined ? { dueDate: res.data.dueDate ? res.data.dueDate.substring(0, 10) : '' } : {}),
          ...(patch.estimatedHours !== undefined ? { estimatedHours: res.data.estimatedHours ?? '' } : {}),
          ...(patch.actualHours !== undefined ? { actualHours: res.data.actualHours ?? '' } : {}),
          ...(patch.assigneeId !== undefined ? { assigneeId: res.data.assigneeId || '' } : {}),
        }));
      }
      fetchProjectData({ silent: true });
      return res.data;
    };

    const queued = patchQueueRef.current.then(runPatch, runPatch);
    patchQueueRef.current = queued.catch(() => {});
    return queued;
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${selectedTask.taskCode}: ${selectedTask.title}"?`)) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      setSelectedTask(null);
      fetchProjectData();
    } catch (err) {
      alert('Không thể xóa công việc: ' + (err.response?.data?.message || err.message));
    }
  };

  const createSubtask = async (title) => {
    await api.post('/tasks', {
      projectId: id,
      title,
      description: null,
      priority: 2,
      dueDate: null,
      estimatedHours: null,
      assigneeId: selectedTask.assigneeId || null,
      parentTaskId: selectedTask.id
    });
    const refreshed = await api.get(`/tasks/${selectedTask.id}`);
    setSelectedTask(refreshed.data);
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? refreshed.data : t));
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    try {
      await createSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    } catch (err) {
      alert('Không thể thêm công việc con: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRequestInsight = async () => {
    setAiInsightLoading(true);
    setAiInsightError('');
    try {
      const res = await api.post(`/ai/projects/${id}/insight`);
      setAiInsight(res.data);
    } catch (err) {
      setAiInsightError(err.response?.data?.message || 'Không thể lấy nhận xét từ AI.');
    } finally {
      setAiInsightLoading(false);
    }
  };

  const handleSuggestSubtasks = async () => {
    if (!selectedTask) return;
    setSuggestionLoading(true);
    setSuggestionError('');
    try {
      const res = await api.post(`/ai/tasks/${selectedTask.id}/subtask-suggestions`);
      setSubtaskSuggestions(res.data.suggestions);
      if (res.data.suggestions.length === 0) {
        setSuggestionError('AI không có đề xuất mới cho công việc này.');
      }
    } catch (err) {
      setSuggestionError(err.response?.data?.message || 'Không thể lấy gợi ý từ AI.');
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleAddSuggestedSubtask = async (title) => {
    try {
      await createSubtask(title);
      setSubtaskSuggestions(prev => prev.filter(s => s !== title));
    } catch (err) {
      alert('Không thể thêm công việc con: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSuggestAssignees = async () => {
    if (!selectedTask) return;
    try {
      const res = await api.get(`/ai/tasks/${selectedTask.id}/assignee-suggestions`);
      setAssigneeSuggestions(res.data);
    } catch (err) {
      alert('Không thể lấy gợi ý người thực hiện: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleSubtask = async (subTask) => {
    if (!selectedTask) return;
    try {
      const nextStatus = subTask.status === 4 ? 1 : 4;
      await api.put(`/tasks/${subTask.id}`, {
        title: subTask.title,
        description: null,
        status: nextStatus,
        priority: 2,
        dueDate: null,
        estimatedHours: null,
        actualHours: null,
        assigneeId: null
      });
      const refreshed = await api.get(`/tasks/${selectedTask.id}`);
      setSelectedTask(refreshed.data);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? refreshed.data : t));
    } catch (err) {
      alert('Không thể cập nhật công việc con: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSubtask = async (subTaskId) => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${subTaskId}`);
      const refreshed = await api.get(`/tasks/${selectedTask.id}`);
      setSelectedTask(refreshed.data);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? refreshed.data : t));
    } catch (err) {
      alert('Không thể xóa công việc con: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddComment = async (e, overrideContent = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const content = (overrideContent !== null ? overrideContent : commentText).trim();
    const targetTask = selectedTaskRef.current;
    if (!content || !targetTask) return false;
    const res = await api.post(`/tasks/${targetTask.id}/comments`, { content });
    if (selectedTaskRef.current?.id === targetTask.id) {
      const updatedComments = [...(selectedTaskRef.current.comments || []), res.data];
      selectedTaskRef.current = { ...selectedTaskRef.current, comments: updatedComments };
      setSelectedTask((prev) => (prev && prev.id === targetTask.id ? { ...prev, comments: updatedComments } : prev));
      setTasks((prev) => prev.map((t) => (t.id === targetTask.id ? { ...t, comments: updatedComments } : t)));
      setCommentText('');
    }
    return true;
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
            <div className="realtime-status-pill">
              <span className="pulse-dot" />
              <span>SignalR: {signalRConnected ? 'Trực tuyến' : 'Đang kết nối...'}</span>
            </div>
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary">
              <PersonAddAlt1OutlinedIcon fontSize="small" />
              <span>Mời Thành Viên ({project.members?.length || 1})</span>
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="btn-secondary" title="Cài đặt dự án">
              <SettingsOutlinedIcon fontSize="small" />
              <span>Cài đặt</span>
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
            className={`tab-btn ${activeTab === 'gantt' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('gantt');
              fetchScheduleData();
            }}
          >
            <AccountTreeOutlinedIcon fontSize="small" />
            <span>Tiến Độ & Đường Găng (CPM)</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <ForumOutlinedIcon fontSize="small" />
            <span>Trao Đổi & Trợ Lý AI {chatMessages.length > 0 ? `(${chatMessages.length})` : ''}</span>
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
          <KanbanTab
            columns={COLUMNS}
            project={project}
            tasks={tasks}
            kanbanSearch={kanbanSearch}
            setKanbanSearch={setKanbanSearch}
            kanbanAssignee={kanbanAssignee}
            setKanbanAssignee={setKanbanAssignee}
            kanbanPriority={kanbanPriority}
            setKanbanPriority={setKanbanPriority}
            draggedTaskId={draggedTaskId}
            dragOverColId={dragOverColId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onOpenTaskDetail={handleOpenTaskDetail}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'status-reports' && (
          <HealthReportsTab
            healthOverview={healthOverview}
            healthLabels={HEALTH_LABELS}
            aiInsight={aiInsight}
            aiInsightLoading={aiInsightLoading}
            aiInsightError={aiInsightError}
            timeframeFilter={timeframeFilter}
            onOpenReportModal={handleOpenReportModal}
            onRequestInsight={handleRequestInsight}
            onTimeframeChange={handleTimeframeChange}
            onClearTimeframe={() => {
              setTimeframeFilter({ startDate: '', endDate: '' });
              fetchHealthOverview('', '');
            }}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {activeTab === 'notes' && (
          <MeetingNotesTab
            notes={notes}
            onOpenNoteModal={() => setShowNoteModal(true)}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {activeTab === 'chat' && (
          <ProjectChatTab
            currentUser={currentUser}
            signalRConnected={signalRConnected}
            chatLoading={chatLoading}
            chatMessages={chatMessages}
            aiThinking={aiThinking}
            chatBottomRef={chatBottomRef}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatSending={chatSending}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'gantt' && (
          <CpmGanttTab
            scheduleData={scheduleData}
            scheduleLoading={scheduleLoading}
            onOpenDependencyModal={() => {
              setDepError('');
              setShowDependencyModal(true);
            }}
            onDeleteDependency={handleDeleteDependency}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsAuditTab
            project={project}
            tasks={tasks}
            analytics={analytics}
            scheduleData={scheduleData}
            healthOverview={healthOverview}
            activities={activities}
          />
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

              {project.members?.length > 0 && (
                <div className="project-members-strip">
                  {project.members.map((m) => (
                    <div key={m.userId} className="project-member-chip" title={m.email}>
                      <UserAvatar name={m.fullName} email={m.email} avatarUrl={m.avatarUrl} size="xs" />
                      <span>{m.fullName}</span>
                      {m.role !== 1 && (
                        <button
                          type="button"
                          className="btn-remove-member-chip"
                          title="Gỡ thành viên khỏi dự án"
                          onClick={async () => {
                            setMemberError('');
                            try {
                              await api.delete(`/projects/${id}/members/${m.userId}`);
                              fetchProjectData();
                            } catch (err) {
                              setMemberError(err.response?.data?.message || 'Không thể gỡ thành viên.');
                            }
                          }}
                        >
                          <CloseIcon style={{ fontSize: 13 }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

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

        {showDependencyModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h2>Thêm Ràng Buộc Thứ Tự Công Việc</h2>
              <p>Thiết lập quan hệ Finish-to-Start (FS) nhằm tự động cập nhật tiến độ và đường găng (CPM).</p>

              {depError && (
                <div className="alert-error">
                  <ErrorOutlineOutlinedIcon fontSize="small" />
                  <span>{depError}</span>
                </div>
              )}

              <form onSubmit={handleAddDependency}>
                <div className="form-group">
                  <label>Công việc đi trước (Predecessor) *</label>
                  <select
                    required
                    value={newDep.predecessorTaskId}
                    onChange={(e) => setNewDep({ ...newDep, predecessorTaskId: e.target.value })}
                  >
                    <option value="">-- Chọn công việc đi trước --</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.taskCode}: {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Công việc đi sau (Successor) *</label>
                  <select
                    required
                    value={newDep.successorTaskId}
                    onChange={(e) => setNewDep({ ...newDep, successorTaskId: e.target.value })}
                  >
                    <option value="">-- Chọn công việc đi sau --</option>
                    {tasks
                      .filter((t) => t.id !== newDep.predecessorTaskId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode}: {t.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Độ trễ cách ngày (Lag Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={newDep.lagDays}
                    onChange={(e) => setNewDep({ ...newDep, lagDays: e.target.value })}
                    placeholder="Mặc định 0 ngày (bắt đầu ngay sau khi việc trước xong)"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setDepError('');
                      setShowDependencyModal(false);
                    }}
                    className="btn-secondary"
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-primary">
                    Xác nhận liên kết
                  </button>
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
                  <AssigneeSelect
                    members={project.members || []}
                    value={newTask.assigneeId || ''}
                    onChange={(val) => setNewTask({ ...newTask, assigneeId: val })}
                    placeholder="-- Chưa chỉ định (Unassigned) --"
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

                <div className="form-group">
                  <label>Số giờ ước lượng (Estimated Hours)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Ví dụ: 8"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                  />
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

        <ProjectSettingsModal
          key={showSettingsModal ? `${project.id}-${project.name}` : 'closed'}
          project={project}
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSaveProject={async (payload) => {
            await api.put(`/projects/${id}`, payload);
            await fetchProjectData();
          }}
          onDeleteProject={async () => {
            await api.delete(`/projects/${id}`);
            navigate('/');
          }}
        />

        <TaskDetailModal
          key={selectedTask?.id || 'closed'}
          selectedTask={selectedTask}
          project={project}
          columns={COLUMNS}
          taskEditForm={taskEditForm}
          setTaskEditForm={setTaskEditForm}
          assigneeSuggestions={assigneeSuggestions}
          newSubtaskTitle={newSubtaskTitle}
          setNewSubtaskTitle={setNewSubtaskTitle}
          suggestionLoading={suggestionLoading}
          suggestionError={suggestionError}
          subtaskSuggestions={subtaskSuggestions}
          commentText={commentText}
          setCommentText={setCommentText}
          onClose={() => {
            selectedTaskRef.current = null;
            setSelectedTask(null);
          }}
          onDeleteTask={handleDeleteTask}
          onPatchTask={handlePatchTask}
          onSuggestAssignees={handleSuggestAssignees}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onAddSubtask={handleAddSubtask}
          onSuggestSubtasks={handleSuggestSubtasks}
          onAddSuggestedSubtask={handleAddSuggestedSubtask}
          onAddComment={handleAddComment}
        />
      </div>
    </div>
  );
}
