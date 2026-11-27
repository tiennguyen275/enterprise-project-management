import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

export default function CpmGanttTab({
  scheduleData,
  scheduleLoading,
  onOpenDependencyModal,
  onDeleteDependency,
}) {
  return (
    <div className="gantt-cpm-layout">
      <div className="cpm-summary-grid">
        <div className="cpm-stat-card card-duration">
          <div className="card-top-header">
            <span className="stat-title">Tổng Thời Lượng Dự Án</span>
            <div className="stat-icon-badge badge-duration">
              <AccessTimeIcon fontSize="small" />
            </div>
          </div>
          <strong className="stat-val duration-text">{scheduleData?.totalProjectDays || 0} ngày</strong>
          <span className="stat-hint">Tính từ ngày bắt đầu dự án</span>
        </div>
        <div className="cpm-stat-card card-projected">
          <div className="card-top-header">
            <span className="stat-title">Ngày Hoàn Thành Dự Kiến</span>
            <div className="stat-icon-badge badge-projected">
              <CalendarTodayOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong className="stat-val projected-text">
            {scheduleData?.projectedEndDate ? new Date(scheduleData.projectedEndDate).toLocaleDateString('vi-VN') : '---'}
          </strong>
          <span className="stat-hint">Thời điểm cán đích theo đường găng</span>
        </div>
        <div className="cpm-stat-card card-critical">
          <div className="card-top-header">
            <span className="stat-title">Công Việc Thuộc Đường Găng</span>
            <div className="stat-icon-badge badge-critical-accent">
              <WarningAmberOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong className="stat-val critical-text">{scheduleData?.criticalTasksCount || 0} việc</strong>
          <span className="stat-hint">Độ trôi (Total Float) = 0 ngày</span>
        </div>
        <div className="cpm-stat-card card-deps">
          <div className="card-top-header">
            <span className="stat-title">Số Lượng Ràng Buộc (FS)</span>
            <div className="stat-icon-badge badge-deps">
              <AccountTreeOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong className="stat-val deps-text">{scheduleData?.dependencies?.length || 0} liên kết</strong>
          <span className="stat-hint">Quan hệ hoàn thành - bắt đầu</span>
        </div>
      </div>

      <div className="cpm-action-toolbar">
        <div className="toolbar-info">
          <span className="legend-label">Chú giải:</span>
          <span className="critical-legend">Đường găng (Bắt buộc đúng hạn)</span>
          <span className="float-legend">Có thời gian dự trữ (Slack)</span>
        </div>
        <button type="button" className="btn-add-dep" onClick={onOpenDependencyModal}>
          <AddIcon fontSize="small" />
          <span>Thêm Ràng Buộc (Finish-to-Start)</span>
        </button>
      </div>

      <div className="cpm-table-wrapper">
        <table className="cpm-table">
          <thead>
            <tr>
              <th>Mã việc</th>
              <th>Tên công việc</th>
              <th className="col-center">Thời lượng</th>
              <th className="col-center">ES / EF</th>
              <th className="col-center">LS / LF</th>
              <th className="col-center">Độ trôi (Float)</th>
              <th className="col-center">Phân loại</th>
              <th>Biểu đồ tiến độ (Gantt CPM Timeline)</th>
            </tr>
          </thead>
          <tbody>
            {scheduleLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Đang tính toán ma trận đường găng CPM...
                </td>
              </tr>
            ) : !scheduleData || scheduleData.schedule.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Chưa có dữ liệu công việc để thiết lập tiến độ.
                </td>
              </tr>
            ) : (
              scheduleData.schedule.map((item) => {
                const totalDays = Math.max(1, scheduleData.totalProjectDays || 1);
                const leftPercent = Math.max(0, Math.min(95, (item.earlyStartDay / totalDays) * 100));
                const widthPercent = Math.max(4, Math.min(100 - leftPercent, (item.durationDays / totalDays) * 100));

                return (
                  <tr key={item.taskId} className={item.isCritical ? 'is-critical-row' : ''}>
                    <td>
                      <span className="task-code-badge">{item.taskCode}</span>
                    </td>
                    <td>
                      <div className="task-title-text">{item.title}</div>
                      {item.assigneeName && (
                        <small className="task-assignee-text">Phụ trách: {item.assigneeName}</small>
                      )}
                    </td>
                    <td className="col-center tabular-text">{item.durationDays} ngày</td>
                    <td className="col-center tabular-text">N{item.earlyStartDay} - N{item.earlyFinishDay}</td>
                    <td className="col-center tabular-text">N{item.lateStartDay} - N{item.lateFinishDay}</td>
                    <td className="col-center">
                      <span className={`float-pill ${item.isCritical ? 'zero-float' : ''}`}>
                        {item.totalFloatDays} ngày
                      </span>
                    </td>
                    <td className="col-center">
                      {item.isCritical ? (
                        <span className="badge-critical">Đường găng</span>
                      ) : (
                        <span className="badge-normal">Dự trữ ({item.totalFloatDays}d)</span>
                      )}
                    </td>
                    <td className="gantt-bar-cell">
                      <div className="gantt-track">
                        <div
                          className={`gantt-bar ${item.isCritical ? 'bar-critical' : 'bar-normal'}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          title={`${item.taskCode}: ${item.title} (${item.durationDays} ngày, ES: ${item.earlyStartDay}, EF: ${item.earlyFinishDay}, Float: ${item.totalFloatDays}d)`}
                        >
                          {item.durationDays}d
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="dependencies-card">
        <div className="deps-card-header">
          <div>
            <h4>Danh Sách Ràng Buộc Thứ Tự Thực Hiện (Precedence Relationships)</h4>
            <p>Mô hình quan hệ Finish-to-Start (FS): Công việc sau chỉ được bắt đầu sau khi công việc trước đã hoàn tất.</p>
          </div>
          {scheduleData?.dependencies?.length > 0 && (
            <button type="button" className="btn-add-dep-mini" onClick={onOpenDependencyModal}>
              <AddIcon fontSize="small" />
              <span>Thêm ràng buộc</span>
            </button>
          )}
        </div>

        {!scheduleData?.dependencies || scheduleData.dependencies.length === 0 ? (
          <div className="empty-deps-box">
            <AccountTreeOutlinedIcon className="empty-deps-icon" />
            <div className="empty-deps-title">Chưa có ràng buộc phụ thuộc nào</div>
            <div className="empty-deps-desc">
              Tạo quan hệ Finish-to-Start (FS) để hệ thống tự động tính toán đường găng (CPM) và ngày hoàn thành dự án.
            </div>
            <button type="button" className="btn-add-dep-empty" onClick={onOpenDependencyModal}>
              <AddIcon fontSize="small" />
              <span>Thêm ràng buộc đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="dep-list">
            {scheduleData.dependencies.map((dep) => (
              <div key={dep.id} className="dep-chip">
                <span className="chip-code">{dep.predecessorCode}</span>
                <span className="dep-arrow">➔</span>
                <span className="chip-code">{dep.successorCode}</span>
                {dep.lagDays > 0 && <span className="chip-lag">+{dep.lagDays} ngày</span>}
                <button
                  type="button"
                  className="btn-del-dep"
                  title="Xóa ràng buộc này"
                  onClick={() => onDeleteDependency(dep.id)}
                >
                  <CloseIcon style={{ fontSize: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
