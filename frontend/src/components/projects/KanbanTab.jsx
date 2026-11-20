import React from 'react';
import AssigneeSelect from '../common/AssigneeSelect';
import UserAvatar from '../common/UserAvatar';
import { matchesSearch } from '../../utils/textSearch';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export default function KanbanTab({
  columns,
  project,
  tasks,
  kanbanSearch,
  setKanbanSearch,
  kanbanAssignee,
  setKanbanAssignee,
  kanbanPriority,
  setKanbanPriority,
  draggedTaskId,
  dragOverColId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenTaskDetail,
  onUpdateStatus,
}) {
  return (
    <>
      <div className="kanban-toolbar">
        <div className="toolbar-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm theo mã (PRJ-1) hoặc tên công việc..."
              value={kanbanSearch}
              onChange={(e) => setKanbanSearch(e.target.value)}
            />
          </div>

          <AssigneeSelect
            className="filter-assignee-select"
            members={project.members || []}
            value={kanbanAssignee}
            onChange={(val) => setKanbanAssignee(val)}
            extraOptions={[
              { value: 'ALL', label: 'Tất cả người thực hiện' },
              { value: 'UNASSIGNED', label: 'Chưa chỉ định' },
            ]}
          />

          <select
            className="filter-select"
            value={kanbanPriority}
            onChange={(e) => setKanbanPriority(e.target.value)}
          >
            <option value="ALL">Tất cả độ ưu tiên</option>
            <option value="4">Khẩn cấp</option>
            <option value="3">Cao</option>
            <option value="2">Trung bình</option>
            <option value="1">Thấp</option>
          </select>

          {(kanbanSearch || kanbanAssignee !== 'ALL' || kanbanPriority !== 'ALL') && (
            <button
              type="button"
              className="btn-reset-filter"
              onClick={() => {
                setKanbanSearch('');
                setKanbanAssignee('ALL');
                setKanbanPriority('ALL');
              }}
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="toolbar-summary">
          Tổng số: {tasks.length} công việc
        </div>
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => {
            if (t.status !== col.id) return false;
            if (kanbanSearch.trim()) {
              const matchTitle = matchesSearch(t.title, kanbanSearch);
              const matchCode = matchesSearch(t.taskCode, kanbanSearch);
              const matchAssignee = matchesSearch(t.assigneeName, kanbanSearch);
              if (!matchTitle && !matchCode && !matchAssignee) return false;
            }
            if (kanbanAssignee === 'UNASSIGNED' && t.assigneeId) return false;
            if (kanbanAssignee !== 'ALL' && kanbanAssignee !== 'UNASSIGNED' && t.assigneeId !== kanbanAssignee) return false;
            if (kanbanPriority !== 'ALL' && t.priority !== parseInt(kanbanPriority, 10)) return false;
            return true;
          });
          const isOver = dragOverColId === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${isOver ? 'column-drag-over' : ''}`}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={(e) => onDragLeave(e, col.id)}
              onDrop={(e) => onDrop(e, col.id)}
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
                  colTasks.map((task) => {
                    const totalSub = task.subTasks?.length || 0;
                    const doneSub = task.subTasks?.filter((s) => s.status === 4).length || 0;
                    const commentCount = task.comments?.length || 0;
                    const hasTime = task.estimatedHours != null || task.actualHours != null;
                    const isOverTime = task.estimatedHours != null && task.actualHours != null && task.actualHours > task.estimatedHours;

                    return (
                      <div
                        key={task.id}
                        className={`kanban-task-card priority-border-${task.priority} ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onClick={() => onOpenTaskDetail(task.id)}
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
                            <UserAvatar name={task.assigneeName} avatarUrl={task.assigneeAvatarUrl} size="xs" />
                            <span>{task.assigneeName}</span>
                          </div>
                        )}

                        {(totalSub > 0 || hasTime || commentCount > 0) && (
                          <div className="task-card-badges">
                            {totalSub > 0 && (
                              <span className={`meta-pill ${doneSub === totalSub ? 'subtask-done' : ''}`}>
                                <CheckCircleOutlineIcon style={{ fontSize: 12 }} />
                                <span>{doneSub}/{totalSub} việc con</span>
                              </span>
                            )}
                            {hasTime && (
                              <span className={`meta-pill ${isOverTime ? 'time-over' : ''}`}>
                                <AccessTimeIcon style={{ fontSize: 12 }} />
                                <span>{task.actualHours ?? 0}h / {task.estimatedHours ?? 0}h</span>
                              </span>
                            )}
                            {commentCount > 0 && (
                              <span className="meta-pill">
                                <ChatBubbleOutlineOutlinedIcon style={{ fontSize: 12 }} />
                                <span>{commentCount}</span>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="task-card-actions">
                          <span className="drag-hint"><DragIndicatorIcon style={{ fontSize: 14 }} /> Kéo thả hoặc chọn</span>
                          <select
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateStatus(task.id, parseInt(e.target.value, 10))}
                            className="status-dropdown"
                          >
                            {columns.map((c) => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
