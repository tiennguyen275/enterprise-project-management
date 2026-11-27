import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import AssigneeSelect from '../common/AssigneeSelect';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import HistoryIcon from '@mui/icons-material/History';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  const datePart = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

function getActionMeta(action) {
  switch (action) {
    case 'task_created':
      return { label: 'Tạo mới', tone: 'blue' };
    case 'task_updated':
      return { label: 'Cập nhật', tone: 'indigo' };
    case 'task_assigned':
      return { label: 'Phân công', tone: 'amber' };
    case 'subtask_created':
      return { label: 'Thêm việc con', tone: 'teal' };
    case 'subtask_updated':
      return { label: 'Việc con', tone: 'green' };
    case 'subtask_deleted':
      return { label: 'Xóa việc con', tone: 'red' };
    case 'attachment_uploaded':
      return { label: 'Đính kèm', tone: 'blue' };
    case 'attachment_deleted':
      return { label: 'Xóa tệp', tone: 'red' };
    case 'comment_added':
      return { label: 'Bình luận', tone: 'slate' };
    default:
      return { label: 'Hoạt động', tone: 'slate' };
  }
}

function normalizeHours(val) {
  if (val === '' || val === null || val === undefined) return null;
  const parsed = parseFloat(val);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function TaskDetailModal({
  selectedTask,
  project,
  columns,
  taskEditForm,
  setTaskEditForm,
  assigneeSuggestions,
  newSubtaskTitle,
  setNewSubtaskTitle,
  suggestionLoading,
  suggestionError,
  subtaskSuggestions,
  commentText,
  setCommentText,
  onClose,
  onDeleteTask,
  onPatchTask,
  onSuggestAssignees,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
  onSuggestSubtasks,
  onAddSuggestedSubtask,
  onAddComment,
}) {
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [rightTab, setRightTab] = useState('comments');
  const [taskActivities, setTaskActivities] = useState([]);
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [apiToast, setApiToast] = useState(null);

  const taskId = selectedTask?.id;
  const subList = selectedTask?.subTasks || [];
  const doneCount = subList.filter((s) => s.status === 4).length;
  const commentsCount = selectedTask?.comments?.length || 0;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!taskId) return undefined;
    let isMounted = true;
    api.get(`/tasks/${taskId}/attachments`)
      .then((res) => {
        if (isMounted) setAttachments(res.data || []);
      })
      .catch(() => {
        if (isMounted) setAttachments([]);
      });
    return () => {
      isMounted = false;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return undefined;
    let isMounted = true;
    api.get(`/tasks/${taskId}/activities?limit=60`)
      .then((res) => {
        if (isMounted) setTaskActivities(res.data || []);
      })
      .catch(() => {
        if (isMounted) setTaskActivities([]);
      });
    return () => {
      isMounted = false;
    };
  }, [
    taskId,
    historyRefreshTick,
    selectedTask?.status,
    selectedTask?.priority,
    selectedTask?.assigneeId,
    selectedTask?.dueDate,
    selectedTask?.estimatedHours,
    selectedTask?.actualHours,
    selectedTask?.description,
    subList.length,
    doneCount,
    commentsCount,
  ]);

  if (!selectedTask) return null;

  const showToast = (type, text, durationMs = 2600) => {
    if (!isMountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setApiToast({ type, text });
    if (durationMs > 0) {
      toastTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setApiToast(null);
      }, durationMs);
    }
  };

  const runRealtimePatch = async (patch, successText, rollbackFn) => {
    showToast('loading', 'Đang lưu thay đổi...', 0);
    try {
      const updated = await onPatchTask(patch);
      if (!isMountedRef.current || !updated) return;
      showToast('success', successText, 2500);
    } catch (err) {
      if (!isMountedRef.current) return;
      if (rollbackFn) rollbackFn();
      const msg = err.response?.data?.message || err.message || 'Không thể lưu thay đổi.';
      showToast('error', `Lỗi lưu: ${msg}`, 4000);
    }
  };

  const handleStatusChange = (e) => {
    const nextStatus = parseInt(e.target.value, 10);
    const prevStatus = taskEditForm.status;
    setTaskEditForm((prev) => ({ ...prev, status: nextStatus }));
    runRealtimePatch(
      { status: nextStatus },
      'Đã cập nhật trạng thái công việc',
      () => setTaskEditForm((prev) => ({ ...prev, status: prevStatus })),
    );
  };

  const handlePriorityChange = (e) => {
    const nextPriority = parseInt(e.target.value, 10);
    const prevPriority = taskEditForm.priority;
    setTaskEditForm((prev) => ({ ...prev, priority: nextPriority }));
    runRealtimePatch(
      { priority: nextPriority },
      'Đã cập nhật độ ưu tiên',
      () => setTaskEditForm((prev) => ({ ...prev, priority: prevPriority })),
    );
  };

  const handleAssigneeChange = (nextAssigneeId) => {
    if ((nextAssigneeId || '') === (selectedTask.assigneeId || '')) return;
    const prevAssigneeId = taskEditForm.assigneeId;
    setTaskEditForm((prev) => ({ ...prev, assigneeId: nextAssigneeId }));
    runRealtimePatch(
      { assigneeId: nextAssigneeId },
      'Đã cập nhật người thực hiện',
      () => setTaskEditForm((prev) => ({ ...prev, assigneeId: prevAssigneeId })),
    );
  };

  const isCompleteValidDate = (dateStr) => {
    if (!dateStr) return true;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return false;
    const year = parseInt(match[1], 10);
    return year >= 1900 && year <= 2100;
  };

  const handleDueDateChange = (e) => {
    const nextDueDate = e.target.value;
    const prevDueDate = taskEditForm.dueDate;
    setTaskEditForm((prev) => ({ ...prev, dueDate: nextDueDate }));
    if (!isCompleteValidDate(nextDueDate)) return;
    const savedDueDate = selectedTask.dueDate ? selectedTask.dueDate.substring(0, 10) : '';
    if (nextDueDate === savedDueDate) return;
    runRealtimePatch(
      { dueDate: nextDueDate },
      'Đã cập nhật hạn hoàn thành',
      () => setTaskEditForm((prev) => ({ ...prev, dueDate: prevDueDate })),
    );
  };

  const handleHoursBlur = (field, label) => {
    const currentVal = normalizeHours(taskEditForm[field]);
    const savedVal = normalizeHours(selectedTask[field]);
    if (currentVal === savedVal) return;
    const fallback = selectedTask[field] ?? '';
    runRealtimePatch(
      { [field]: taskEditForm[field] },
      `Đã cập nhật ${label}`,
      () => setTaskEditForm((prev) => ({ ...prev, [field]: fallback })),
    );
  };

  const handleHoursKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleSaveDescription = async (e) => {
    e.preventDefault();
    setSavingDesc(true);
    try {
      await runRealtimePatch(
        { description: taskEditForm.description },
        'Đã lưu mô tả công việc',
      );
    } finally {
      if (isMountedRef.current) setSavingDesc(false);
    }
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingFile(true);
    showToast('loading', `Đang tải lên "${file.name}"...`, 0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/tasks/${selectedTask.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!isMountedRef.current) return;
      setAttachments((prev) => [res.data, ...prev]);
      setHistoryRefreshTick((t) => t + 1);
      showToast('success', `Đã đính kèm tệp "${res.data.fileName}"`, 2600);
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('error', err.response?.data?.message || 'Không thể tải tệp đính kèm lên.', 4000);
    } finally {
      if (isMountedRef.current) setUploadingFile(false);
    }
  };

  const handleDownloadAttachment = async (att) => {
    try {
      const res = await api.get(`/tasks/${selectedTask.id}/attachments/${att.id}/download`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = att.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('error', 'Không thể tải xuống tệp đính kèm.', 3500);
    }
  };

  const handleDeleteAttachment = async (attId) => {
    showToast('loading', 'Đang xóa tệp đính kèm...', 0);
    try {
      await api.delete(`/tasks/${selectedTask.id}/attachments/${attId}`);
      if (!isMountedRef.current) return;
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
      setHistoryRefreshTick((t) => t + 1);
      showToast('success', 'Đã xóa tệp đính kèm', 2500);
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('error', err.response?.data?.message || 'Không thể xóa tệp đính kèm.', 4000);
    }
  };

  const handleSubmitComment = async (e) => {
    await onAddComment(e);
  };

  const subPct = subList.length > 0 ? Math.round((doneCount / subList.length) * 100) : 0;
  const isDescriptionDirty = (taskEditForm.description || '') !== (selectedTask.description || '');

  return (
    <div className="modal-backdrop">
      <div className="modal-card task-detail-modal">
        <div className="detail-modal-header clickup-header">
          <div className="clickup-breadcrumb">
            <span className="breadcrumb-project">
              <span className="project-dot" />
              {project?.code || 'PROJECT'}
            </span>
            <span className="breadcrumb-sep">|</span>
            <span className="breadcrumb-type">
              <CheckCircleOutlineIcon style={{ fontSize: 15 }} />
              Task
            </span>
            <span className="breadcrumb-sep">|</span>
            <span className="breadcrumb-task-code">
              <span className="code-dot" />
              {selectedTask.taskCode}
            </span>
          </div>
          <div className="detail-header-actions">
            <button type="button" onClick={onDeleteTask} className="btn-delete-task">
              <DeleteOutlineOutlinedIcon style={{ fontSize: 16 }} />
              <span>Xóa công việc</span>
            </button>
            <button type="button" onClick={onClose} className="btn-close" aria-label="Đóng">
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </div>

        <div className="detail-modal-split clickup-split">
          <div className="detail-main-pane">
            <h2 className="detail-task-title">{selectedTask.title}</h2>

            <div className="clickup-meta-form">
              <div className="clickup-prop-grid">
                <div className="prop-row">
                  <label className="prop-label">Trạng thái</label>
                  <div className="prop-control">
                    <select
                      className={`status-select-pill status-val-${taskEditForm.status}`}
                      value={taskEditForm.status}
                      onChange={handleStatusChange}
                    >
                      {columns.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="prop-row">
                  <label className="prop-label">Người thực hiện</label>
                  <div className="prop-control prop-assignee-control">
                    <AssigneeSelect
                      members={project.members || []}
                      value={taskEditForm.assigneeId}
                      onChange={handleAssigneeChange}
                      placeholder="-- Chưa chỉ định --"
                    />
                    <button type="button" className="btn-ai-inline" onClick={onSuggestAssignees}>
                      Gợi ý AI
                    </button>
                  </div>
                </div>

                <div className="prop-row">
                  <label className="prop-label">Độ ưu tiên</label>
                  <div className="prop-control">
                    <select
                      value={taskEditForm.priority}
                      onChange={handlePriorityChange}
                    >
                      <option value={1}>Thấp</option>
                      <option value={2}>Trung bình</option>
                      <option value={3}>Cao</option>
                      <option value={4}>Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                <div className="prop-row">
                  <label className="prop-label">Hạn hoàn thành</label>
                  <div className="prop-control">
                    <input
                      type="date"
                      value={taskEditForm.dueDate}
                      onChange={handleDueDateChange}
                    />
                  </div>
                </div>

                <div className="prop-row">
                  <label className="prop-label">Giờ ước lượng (h)</label>
                  <div className="prop-control">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      value={taskEditForm.estimatedHours}
                      onChange={(e) => setTaskEditForm((prev) => ({ ...prev, estimatedHours: e.target.value }))}
                      onBlur={() => handleHoursBlur('estimatedHours', 'giờ ước lượng')}
                      onKeyDown={handleHoursKeyDown}
                    />
                  </div>
                </div>

                <div className="prop-row">
                  <label className="prop-label">Giờ thực tế (h)</label>
                  <div className="prop-control">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      value={taskEditForm.actualHours}
                      onChange={(e) => setTaskEditForm((prev) => ({ ...prev, actualHours: e.target.value }))}
                      onBlur={() => handleHoursBlur('actualHours', 'giờ thực tế')}
                      onKeyDown={handleHoursKeyDown}
                    />
                  </div>
                </div>
              </div>

              {assigneeSuggestions.length > 0 && (
                <div className="ai-assignee-list inline-suggestions">
                  {assigneeSuggestions.map((s) => {
                    const suggestedMember = project.members?.find((m) => m.userId === s.userId);
                    return (
                      <button
                        type="button"
                        key={s.userId}
                        className={`ai-assignee-chip ${s.isRecommended ? 'recommended' : ''}`}
                        onClick={() => handleAssigneeChange(s.userId)}
                      >
                        <span className="ai-assignee-head">
                          <UserAvatar
                            name={s.fullName}
                            email={suggestedMember?.email}
                            avatarUrl={suggestedMember?.avatarUrl}
                            size="xs"
                          />
                          <strong>{s.fullName}</strong>
                        </span>
                        <span>{s.openTasks} việc mở, {s.openEstimatedHours}h</span>
                        {s.isRecommended && <em>Ít việc nhất</em>}
                      </button>
                    );
                  })}
                </div>
              )}

              {(taskEditForm.estimatedHours !== '' || taskEditForm.actualHours !== '') && (() => {
                const est = parseFloat(taskEditForm.estimatedHours) || 0;
                const act = parseFloat(taskEditForm.actualHours) || 0;
                const isOver = est > 0 && act > est;
                const pct = est > 0 ? Math.min(Math.round((act / est) * 100), 100) : (act > 0 ? 100 : 0);

                return (
                  <div className="time-tracking-bar-box">
                    <div className="time-bar-header">
                      <span>Thực tế {act}h / Ước lượng {est}h</span>
                      <span className={`time-status-tag ${isOver ? 'over-budget' : 'within-budget'}`}>
                        {isOver ? `Vượt +${(act - est).toFixed(1)}h` : 'Trong định mức'}
                      </span>
                    </div>
                    <div className="time-bar-track">
                      <div
                        className={`time-bar-fill ${isOver ? 'over-budget' : 'within-budget'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handleSaveDescription} className="desc-editor-card">
                <div className="desc-header-row">
                  <label htmlFor="task-detail-desc">Mô tả</label>
                  {isDescriptionDirty && <span className="desc-unsaved-badge">Chưa lưu</span>}
                </div>
                <textarea
                  id="task-detail-desc"
                  rows={4}
                  placeholder="Nhập mô tả chi tiết yêu cầu công việc..."
                  value={taskEditForm.description}
                  onChange={(e) => setTaskEditForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <div className="clickup-save-bar">
                  <button
                    type="submit"
                    className="btn-primary btn-save-desc"
                    disabled={savingDesc || !isDescriptionDirty}
                  >
                    {savingDesc ? 'Đang lưu...' : 'Lưu mô tả'}
                  </button>
                </div>
              </form>
            </div>

            <div className="subtasks-section">
              <div className="subtasks-header">
                <h3>
                  <CheckCircleOutlineIcon fontSize="small" />
                  <span>Công Việc Con (Subtasks / WBS) ({doneCount}/{subList.length})</span>
                </h3>
                <span className="subtask-progress-label">{subPct}% hoàn thành</span>
              </div>

              <div className="subtask-progress-track">
                <div className="subtask-progress-fill" style={{ width: `${subPct}%` }} />
              </div>

              {subList.length > 0 && (
                <div className="subtasks-list">
                  {subList.map((sub) => (
                    <div key={sub.id} className={`subtask-item ${sub.status === 4 ? 'subtask-done' : ''}`}>
                      <label className="subtask-left">
                        <input
                          type="checkbox"
                          checked={sub.status === 4}
                          onChange={() => onToggleSubtask(sub)}
                        />
                        <span className="subtask-code">{sub.taskCode}</span>
                        <span className="subtask-title">{sub.title}</span>
                      </label>
                      <button
                        type="button"
                        className="btn-remove-subtask"
                        title="Xóa công việc con"
                        onClick={() => onDeleteSubtask(sub.id)}
                      >
                        <DeleteOutlineOutlinedIcon style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={onAddSubtask} className="subtask-add-form">
                <input
                  type="text"
                  placeholder="Thêm công việc con (Subtask) mới..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
                <button type="submit" className="btn-secondary">+ Thêm việc con</button>
              </form>

              <div className="ai-subtask-box">
                <button
                  type="button"
                  className="btn-ai-inline"
                  onClick={onSuggestSubtasks}
                  disabled={suggestionLoading}
                >
                  {suggestionLoading ? 'AI đang phân tích...' : 'Gợi ý việc con bằng AI'}
                </button>
                {suggestionError && <p className="ai-error-text">{suggestionError}</p>}
                {subtaskSuggestions.length > 0 && (
                  <ul className="ai-suggestion-list">
                    {subtaskSuggestions.map((s) => (
                      <li key={s}>
                        <span>{s}</span>
                        <button type="button" className="btn-secondary" onClick={() => onAddSuggestedSubtask(s)}>
                          Thêm
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="attachments-section">
              <div className="attachments-header">
                <h3>
                  <AttachFileOutlinedIcon fontSize="small" />
                  <span>Tệp Đính Kèm ({attachments.length})</span>
                </h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleUploadAttachment}
                />
                <button
                  type="button"
                  className="btn-upload-attachment"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AttachFileOutlinedIcon style={{ fontSize: 15 }} />
                  <span>{uploadingFile ? 'Đang tải lên...' : '+ Đính kèm tệp'}</span>
                </button>
              </div>

              {attachments.length === 0 ? (
                <p className="attachments-empty">Chưa có tệp đính kèm nào (hỗ trợ PDF, ảnh, Word, Excel, ZIP tối đa 10 MB).</p>
              ) : (
                <div className="attachments-list">
                  {attachments.map((att) => (
                    <div key={att.id} className="attachment-item">
                      <div className="attachment-info">
                        <strong title={att.fileName}>{att.fileName}</strong>
                        <span>{formatFileSize(att.fileSizeBytes)} · {att.uploadedByName}</span>
                      </div>
                      <div className="attachment-actions">
                        <button
                          type="button"
                          className="btn-att-action"
                          title="Tải xuống"
                          onClick={() => handleDownloadAttachment(att)}
                        >
                          <DownloadOutlinedIcon style={{ fontSize: 16 }} />
                        </button>
                        <button
                          type="button"
                          className="btn-att-action is-danger"
                          title="Xóa tệp"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          <DeleteOutlineOutlinedIcon style={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="detail-activity-pane">
            <div className="activity-pane-tabs">
              <button
                type="button"
                className={`activity-tab-btn ${rightTab === 'comments' ? 'active' : ''}`}
                onClick={() => setRightTab('comments')}
              >
                <span>THẢO LUẬN</span>
                <span className="tab-count">{commentsCount}</span>
              </button>
              <button
                type="button"
                className={`activity-tab-btn ${rightTab === 'history' ? 'active' : ''}`}
                onClick={() => setRightTab('history')}
              >
                <span>NHẬT KÝ</span>
                <span className="tab-count">{taskActivities.length}</span>
              </button>
            </div>

            {rightTab === 'comments' ? (
              <div className="activity-comments-wrap">
                <div className="activity-pane-body">
                  {commentsCount === 0 ? (
                    <div className="activity-empty-state">
                      <p>Chưa có bình luận nào cho công việc này.</p>
                      <span>Bắt đầu trao đổi với nhóm ở ô bên dưới.</span>
                    </div>
                  ) : (
                    <div className="clickup-comments-list">
                      {selectedTask.comments.map((c) => {
                        const commentMember = project.members?.find((m) => m.userId === c.userId);
                        return (
                          <div key={c.id} className="clickup-comment-row">
                            <UserAvatar
                              name={c.userFullName}
                              email={commentMember?.email}
                              avatarUrl={commentMember?.avatarUrl}
                              size="sm"
                            />
                            <div className="clickup-comment-content">
                              <div className="clickup-comment-meta">
                                <strong>{c.userFullName}</strong>
                                <span>{formatDateTime(c.createdAt)}</span>
                              </div>
                              <div className="clickup-comment-bubble">
                                <p>{c.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitComment} className="activity-pane-composer">
                  <input
                    type="text"
                    placeholder="Ghi chú, phản hồi công việc..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button type="submit" className="btn-send-comment" title="Gửi bình luận">
                    <SendOutlinedIcon style={{ fontSize: 16 }} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="activity-history-wrap">
                <div className="activity-pane-body">
                  {taskActivities.length === 0 ? (
                    <div className="activity-empty-state">
                      <HistoryIcon style={{ fontSize: 28, color: '#94a3b8' }} />
                      <p>Chưa có nhật ký chỉnh sửa nào.</p>
                      <span>Mọi thay đổi về trạng thái, người thực hiện, hạn chót, việc con hoặc tệp đính kèm sẽ tự động được ghi lại tại đây.</span>
                    </div>
                  ) : (
                    <div className="task-history-timeline">
                      {taskActivities.map((act) => {
                        const badge = getActionMeta(act.action);
                        return (
                          <div key={act.id} className="task-history-item">
                            <UserAvatar
                              name={act.actorName}
                              avatarUrl={act.actorAvatarUrl}
                              size="sm"
                            />
                            <div className="history-item-body">
                              <div className="history-item-header">
                                <strong>{act.actorName}</strong>
                                <span className={`history-action-tag tone-${badge.tone}`}>{badge.label}</span>
                              </div>
                              <p className="history-item-desc">{act.description}</p>
                              <span className="history-item-time">{formatDateTime(act.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>

        {apiToast && (
          <div className={`task-api-toast is-${apiToast.type}`} role="status" aria-live="polite">
            {apiToast.type === 'success' && <CheckCircleOutlineIcon style={{ fontSize: 17 }} />}
            {apiToast.type === 'error' && <ErrorOutlineIcon style={{ fontSize: 17 }} />}
            {apiToast.type === 'loading' && <span className="toast-spinner" />}
            <span>{apiToast.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
