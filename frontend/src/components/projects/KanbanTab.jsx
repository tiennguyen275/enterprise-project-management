import React, { useState, useMemo } from 'react';
import AssigneeSelect from '../common/AssigneeSelect';
import UserAvatar from '../common/UserAvatar';
import { matchesSearch } from '../../utils/textSearch';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AddIcon from '@mui/icons-material/Add';

function getPriorityLabel(priority) {
  if (priority === 4) return 'Khẩn cấp';
  if (priority === 3) return 'Cao';
  if (priority === 2) return 'Trung bình';
  return 'Thấp';
}

function getTaskProgressPercent(task) {
  if (task.status === 4) return 100;
  const subList = task.subTasks || [];
  if (subList.length > 0) {
    const done = subList.filter((s) => s.status === 4).length;
    return Math.round((done / subList.length) * 100);
  }
  const est = task.estimatedHours ?? 0;
  const act = task.actualHours ?? 0;
  if (est > 0) return Math.min(Math.round((act / est) * 100), 100);
  if (task.status === 3) return 75;
  if (task.status === 2) return 40;
  return 0;
}

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
  onOpenCreateTask,
}) {
  const [viewMode, setViewMode] = useState('kanban');
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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
  }, [tasks, kanbanSearch, kanbanAssignee, kanbanPriority]);

  const toggleGroup = (colId) => {
    setCollapsedGroups((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  return (
    <>
      <div className="kanban-toolbar">
        <div className="toolbar-filters">
          <div className="search-box">
            <SearchIcon className="search-box-icon" style={{ fontSize: 17 }} />
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

        <div className="toolbar-right-controls">
          <div className="toolbar-summary">
            Hiển thị: {filteredTasks.length}/{tasks.length} công việc
          </div>

          <div className="view-mode-switcher" role="group" aria-label="Chế độ hiển thị">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              aria-pressed={viewMode === 'kanban'}
              onClick={() => setViewMode('kanban')}
            >
              <ViewKanbanOutlinedIcon style={{ fontSize: 16 }} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              <TableRowsOutlinedIcon style={{ fontSize: 16 }} />
              <span>Danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                className={`kanban-column status-col-${col.id} ${isOver ? 'column-drag-over' : ''}`}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDragLeave={(e) => onDragLeave(e, col.id)}
                onDrop={(e) => onDrop(e, col.id)}
              >
                <div className="column-header">
                  <div className="column-title-wrap">
                    <span className="column-status-dot" style={{ backgroundColor: col.color }} />
                    <h3>{col.title}</h3>
                    <span className="count-badge">{colTasks.length}</span>
                  </div>
                  {onOpenCreateTask && (
                    <button
                      type="button"
                      className="btn-col-quick-add"
                      title="Thêm công việc mới"
                      aria-label={`Thêm công việc vào ${col.title}`}
                      onClick={onOpenCreateTask}
                    >
                      <AddIcon style={{ fontSize: 16 }} />
                    </button>
                  )}
                </div>

                <div className="task-list">
                  {colTasks.length === 0 ? (
                    <div className="empty-column-placeholder">
                      <span>{isOver ? 'Thả công việc vào đây...' : 'Chưa có công việc'}</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const totalSub = task.subTasks?.length || 0;
                      const doneSub = task.subTasks?.filter((s) => s.status === 4).length || 0;
                      const subPct = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;
                      const commentCount = task.comments?.length || 0;
                      const hasTime = task.estimatedHours != null || task.actualHours != null;
                      const isOverTime = task.estimatedHours != null && task.actualHours != null && task.actualHours > task.estimatedHours;

                      return (
                        <div
                          key={task.id}
                          className={`kanban-task-card priority-accent-${task.priority} ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                          draggable
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onClick={() => onOpenTaskDetail(task.id)}
                        >
                          <div className="task-card-top">
                            <span className="task-code">{task.taskCode}</span>
                            <span className={`priority-pill priority-${task.priority}`}>
                              <span className="priority-dot" />
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>

                          <h4>{task.title}</h4>

                          {totalSub > 0 && (
                            <div className="card-subtask-progress">
                              <div className="card-sub-meta">
                                <span className={doneSub === totalSub ? 'is-done' : ''}>
                                  <CheckCircleOutlineIcon style={{ fontSize: 13 }} />
                                  {doneSub}/{totalSub} việc con
                                </span>
                                <span className="card-sub-pct">{subPct}%</span>
                              </div>
                              <div className="card-sub-track">
                                <div
                                  className={`card-sub-fill ${doneSub === totalSub ? 'is-done' : ''}`}
                                  style={{ width: `${subPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {(task.dueDate || hasTime || commentCount > 0) && (
                            <div className="task-card-badges">
                              {task.dueDate && (
                                <span className="meta-pill">
                                  <CalendarTodayOutlinedIcon style={{ fontSize: 12 }} />
                                  <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
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

                          <div className="task-card-footer">
                            <div className="card-assignee">
                              {task.assigneeName ? (
                                <>
                                  <UserAvatar name={task.assigneeName} avatarUrl={task.assigneeAvatarUrl} size="xs" />
                                  <span title={task.assigneeName}>{task.assigneeName}</span>
                                </>
                              ) : (
                                <span className="card-unassigned">Chưa chỉ định</span>
                              )}
                            </div>

                            <select
                              value={task.status}
                              aria-label={`Đổi trạng thái ${task.title}`}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => onUpdateStatus(task.id, parseInt(e.target.value, 10))}
                              className="status-quick-select"
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
      ) : (
        <div className="clickup-list-view">
          <div className="list-view-scroll">
            <div className="list-view-head">
              <div className="lv-col-name">TÊN CÔNG VIỆC</div>
              <div className="lv-col-status">TRẠNG THÁI</div>
              <div className="lv-col-priority">ƯU TIÊN</div>
              <div className="lv-col-assignee">NGƯỜI THỰC HIỆN</div>
              <div className="lv-col-due">HẠN HOÀN THÀNH</div>
              <div className="lv-col-progress">TIẾN ĐỘ</div>
            </div>

            {columns.map((col) => {
              const groupTasks = filteredTasks.filter((t) => t.status === col.id);
              const isCollapsed = Boolean(collapsedGroups[col.id]);

              return (
                <div key={col.id} className="list-status-group">
                  <button
                    type="button"
                    className="list-group-header"
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleGroup(col.id)}
                  >
                    <span className="group-chevron">
                      {isCollapsed ? (
                        <KeyboardArrowRightIcon style={{ fontSize: 18 }} />
                      ) : (
                        <KeyboardArrowDownIcon style={{ fontSize: 18 }} />
                      )}
                    </span>
                    <span className={`group-status-pill status-val-${col.id}`}>
                      {col.title}
                    </span>
                    <span className="group-task-count">{groupTasks.length} tasks</span>
                  </button>

                  {!isCollapsed && (
                    <div className="list-group-rows">
                      {groupTasks.map((task) => {
                        const totalSub = task.subTasks?.length || 0;
                        const doneSub = task.subTasks?.filter((s) => s.status === 4).length || 0;
                        const commentCount = task.comments?.length || 0;
                        const pct = getTaskProgressPercent(task);

                        return (
                          <div
                            key={task.id}
                            className="list-task-row"
                            onClick={() => onOpenTaskDetail(task.id)}
                          >
                            <div className="lv-col-name">
                              <CheckCircleOutlineIcon
                                className={`lv-check-icon ${task.status === 4 ? 'is-done' : ''}`}
                                style={{ fontSize: 17 }}
                              />
                              <span className="lv-task-code">{task.taskCode}</span>
                              <button
                                type="button"
                                className="lv-task-title"
                                title={task.title}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTaskDetail(task.id);
                                }}
                              >
                                {task.title}
                              </button>
                              {totalSub > 0 && (
                                <span className={`lv-inline-meta ${doneSub === totalSub ? 'is-done' : ''}`}>
                                  {doneSub}/{totalSub}
                                </span>
                              )}
                              {commentCount > 0 && (
                                <span className="lv-inline-comment">
                                  <ChatBubbleOutlineOutlinedIcon style={{ fontSize: 13 }} />
                                  {commentCount}
                                </span>
                              )}
                            </div>

                            <div className="lv-col-status" onClick={(e) => e.stopPropagation()}>
                              <select
                                className={`lv-status-block status-val-${task.status}`}
                                aria-label={`Trạng thái công việc ${task.title}`}
                                value={task.status}
                                onChange={(e) => onUpdateStatus(task.id, parseInt(e.target.value, 10))}
                              >
                                {columns.map((c) => (
                                  <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                              </select>
                            </div>

                            <div className="lv-col-priority">
                              <span className={`lv-priority-chip priority-${task.priority}`} title={getPriorityLabel(task.priority)}>
                                <FlagOutlinedIcon style={{ fontSize: 14 }} />
                                <span>{getPriorityLabel(task.priority)}</span>
                              </span>
                            </div>

                            <div className="lv-col-assignee">
                              {task.assigneeName ? (
                                <div className="lv-assignee-chip">
                                  <UserAvatar name={task.assigneeName} avatarUrl={task.assigneeAvatarUrl} size="xs" />
                                  <span>{task.assigneeName}</span>
                                </div>
                              ) : (
                                <span className="lv-empty-dash">—</span>
                              )}
                            </div>

                            <div className="lv-col-due">
                              {task.dueDate ? (
                                <span className="lv-due-chip">
                                  <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                                  <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                                </span>
                              ) : (
                                <span className="lv-empty-circle" title="Chưa đặt hạn">
                                  <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                                </span>
                              )}
                            </div>

                            <div className="lv-col-progress">
                              <div className="lv-progress-wrap" title={`${pct}%`}>
                                <div className="lv-progress-track">
                                  <div
                                    className={`lv-progress-fill ${pct === 100 ? 'is-done' : ''}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="lv-progress-pct">{pct}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {onOpenCreateTask && (
                        <button
                          type="button"
                          className="list-quick-add-row"
                          onClick={onOpenCreateTask}
                        >
                          <AddIcon style={{ fontSize: 15 }} />
                          <span>Tạo task</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
