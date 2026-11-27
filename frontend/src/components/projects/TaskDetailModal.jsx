import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import AssigneeSelect from '../common/AssigneeSelect';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TaskDetailModal({
  selectedTask,
  project,
  columns,
  taskEditForm,
  setTaskEditForm,
  taskSaveMsg,
  setTaskSaveMsg,
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
  onSaveTaskDetail,
  onSuggestAssignees,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
  onSuggestSubtasks,
  onAddSuggestedSubtask,
  onAddComment,
}) {
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const taskId = selectedTask?.id;

  useEffect(() => {
    if (!taskId) return undefined;
    let isMounted = true;
    api.get(`/tasks/${taskId}/attachments`)
      .then((res) => {
        if (isMounted) {
          setAttachments(res.data || []);
          setAttachmentError('');
        }
      })
      .catch(() => {
        if (isMounted) setAttachments([]);
      });
    return () => {
      isMounted = false;
    };
  }, [taskId]);

  if (!selectedTask) return null;

  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingFile(true);
    setAttachmentError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/tasks/${selectedTask.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments((prev) => [res.data, ...prev]);
    } catch (err) {
      setAttachmentError(err.response?.data?.message || 'Không thể tải tệp đính kèm lên.');
    } finally {
      setUploadingFile(false);
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
      setAttachmentError('Không thể tải xuống tệp đính kèm.');
    }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await api.delete(`/tasks/${selectedTask.id}/attachments/${attId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
    } catch {
      setAttachmentError('Không thể xóa tệp đính kèm.');
    }
  };

  const subList = selectedTask.subTasks || [];
  const doneCount = subList.filter((s) => s.status === 4).length;
  const subPct = subList.length > 0 ? Math.round((doneCount / subList.length) * 100) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-card task-detail-modal">
        <div className="detail-modal-header">
          <div className="detail-title-group">
            <span className="task-code">{selectedTask.taskCode}</span>
            <h2>{selectedTask.title}</h2>
          </div>
          <div className="detail-header-actions">
            <button type="button" onClick={onDeleteTask} className="btn-delete-task">
              <DeleteOutlineOutlinedIcon style={{ fontSize: 16 }} />
              <span>Xóa công việc</span>
            </button>
            <button onClick={onClose} className="btn-close">
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </div>

        <div className="detail-modal-split">
          <div className="detail-main-pane">
            <div className="desc-editor-card">
              <label htmlFor="task-detail-desc">Mô tả công việc</label>
              <textarea
                id="task-detail-desc"
                form="task-detail-meta-form"
                rows={4}
                placeholder="Nhập mô tả chi tiết yêu cầu công việc..."
                value={taskEditForm.description}
                onChange={(e) => {
                  setTaskSaveMsg('');
                  setTaskEditForm({ ...taskEditForm, description: e.target.value });
                }}
              />
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

              {attachmentError && <p className="ai-error-text">{attachmentError}</p>}

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

            <div className="comments-section">
              <h3><ChatBubbleOutlineOutlinedIcon fontSize="small" /> Thảo Luận & Ghi Chú ({selectedTask.comments?.length || 0})</h3>

              <div className="comments-list">
                {selectedTask.comments?.map((c) => {
                  const commentMember = project.members?.find((m) => m.userId === c.userId);
                  return (
                    <div key={c.id} className="comment-item">
                      <div className="comment-user">
                        <span className="comment-author-wrap">
                          <UserAvatar
                            name={c.userFullName}
                            email={commentMember?.email}
                            avatarUrl={commentMember?.avatarUrl}
                            size="xs"
                          />
                          <strong>{c.userFullName}</strong>
                        </span>
                        <span>{new Date(c.createdAt).toLocaleTimeString('vi-VN')} {new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="comment-body">{c.content}</p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={onAddComment} className="comment-form">
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

          <aside className="detail-sidebar-pane">
            <form id="task-detail-meta-form" onSubmit={onSaveTaskDetail} className="task-meta-editor">
              <div className="sidebar-section-title">Thuộc tính công việc</div>

              <div className="meta-row-2">
                <div className="meta-field">
                  <label>Trạng thái</label>
                  <select
                    value={taskEditForm.status}
                    onChange={(e) => {
                      setTaskSaveMsg('');
                      setTaskEditForm({ ...taskEditForm, status: parseInt(e.target.value, 10) });
                    }}
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="meta-field">
                  <label>Độ ưu tiên</label>
                  <select
                    value={taskEditForm.priority}
                    onChange={(e) => {
                      setTaskSaveMsg('');
                      setTaskEditForm({ ...taskEditForm, priority: parseInt(e.target.value, 10) });
                    }}
                  >
                    <option value={1}>Thấp</option>
                    <option value={2}>Trung bình</option>
                    <option value={3}>Cao</option>
                    <option value={4}>Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="meta-field">
                <label>Người thực hiện (Assignee)</label>
                <AssigneeSelect
                  members={project.members || []}
                  value={taskEditForm.assigneeId}
                  onChange={(val) => {
                    setTaskSaveMsg('');
                    setTaskEditForm({ ...taskEditForm, assigneeId: val });
                  }}
                  placeholder="-- Chưa chỉ định --"
                />
                <button type="button" className="btn-ai-inline" onClick={onSuggestAssignees}>
                  Gợi ý người nhận việc
                </button>
                {assigneeSuggestions.length > 0 && (
                  <div className="ai-assignee-list">
                    {assigneeSuggestions.map((s) => {
                      const suggestedMember = project.members?.find((m) => m.userId === s.userId);
                      return (
                        <button
                          type="button"
                          key={s.userId}
                          className={`ai-assignee-chip ${s.isRecommended ? 'recommended' : ''}`}
                          onClick={() => {
                            setTaskSaveMsg('');
                            setTaskEditForm({ ...taskEditForm, assigneeId: s.userId });
                          }}
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
              </div>

              <div className="meta-field">
                <label>Hạn hoàn thành</label>
                <input
                  type="date"
                  value={taskEditForm.dueDate}
                  onChange={(e) => {
                    setTaskSaveMsg('');
                    setTaskEditForm({ ...taskEditForm, dueDate: e.target.value });
                  }}
                />
              </div>

              <div className="meta-row-2">
                <div className="meta-field">
                  <label>Giờ ước lượng (h)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={taskEditForm.estimatedHours}
                    onChange={(e) => {
                      setTaskSaveMsg('');
                      setTaskEditForm({ ...taskEditForm, estimatedHours: e.target.value });
                    }}
                  />
                </div>

                <div className="meta-field">
                  <label>Giờ thực tế (h)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={taskEditForm.actualHours}
                    onChange={(e) => {
                      setTaskSaveMsg('');
                      setTaskEditForm({ ...taskEditForm, actualHours: e.target.value });
                    }}
                  />
                </div>
              </div>

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

              <div className="meta-editor-footer">
                {taskSaveMsg && <span className="save-feedback">{taskSaveMsg}</span>}
                <button type="submit" className="btn-primary btn-save-task">
                  Lưu Cập Nhật Công Việc
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
