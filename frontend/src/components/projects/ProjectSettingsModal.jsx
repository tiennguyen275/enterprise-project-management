import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

export default function ProjectSettingsModal({
  project,
  open,
  onClose,
  onSaveProject,
  onDeleteProject,
}) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 2);
  const [startDate, setStartDate] = useState(project?.startDate ? project.startDate.substring(0, 10) : '');
  const [endDate, setEndDate] = useState(project?.endDate ? project.endDate.substring(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSaveProject({
        name: name.trim(),
        description: description.trim() || null,
        status: parseInt(status, 10),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật thông tin dự án.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dự án "${project.name}" không?`)) return;
    setSaving(true);
    setError('');
    try {
      await onDeleteProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa dự án.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card project-settings-modal">
        <div className="settings-modal-header">
          <div>
            <h2>Cài Đặt Dự Án ({project.code})</h2>
            <p>Cập nhật thông tin chung, trạng thái vận hành hoặc xóa dự án</p>
          </div>
          <button type="button" className="btn-close-icon" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {error && (
          <div className="alert-error">
            <ErrorOutlineOutlinedIcon fontSize="small" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên dự án *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Mô tả dự án</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục tiêu và phạm vi của dự án..."
            />
          </div>

          <div className="form-group">
            <label>Trạng thái dự án</label>
            <select value={status} onChange={(e) => setStatus(parseInt(e.target.value, 10))}>
              <option value={1}>Đang lập kế hoạch (Planning)</option>
              <option value={2}>Đang hoạt động (Active)</option>
              <option value={3}>Tạm dừng (On Hold)</option>
              <option value={4}>Đã hoàn thành (Completed)</option>
              <option value={5}>Lưu trữ (Archived)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ngày kết thúc dự kiến</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="modal-actions settings-modal-footer">
            <button
              type="button"
              className="btn-danger-soft"
              disabled={saving}
              onClick={handleDelete}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
              <span>Xóa dự án</span>
            </button>

            <div className="settings-footer-right">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <SaveOutlinedIcon fontSize="small" />
                <span>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
