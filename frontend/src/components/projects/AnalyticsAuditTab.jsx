import React from 'react';
import UserAvatar from '../common/UserAvatar';
import { exportTasksToExcelCsv, exportScheduleToExcelCsv, printExecutiveReport } from '../../utils/exportReport';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import HistoryIcon from '@mui/icons-material/History';

export default function AnalyticsAuditTab({
  project,
  tasks,
  analytics,
  scheduleData,
  healthOverview,
  activities,
}) {
  if (!analytics) return null;

  return (
    <div className="analytics-layout">
      <div className="export-actions-bar">
        <button
          type="button"
          className="btn-export-report"
          onClick={() => exportTasksToExcelCsv(project, tasks)}
        >
          <DownloadOutlinedIcon style={{ fontSize: 16 }} />
          <span>Xuất Excel Công việc (.csv)</span>
        </button>
        <button
          type="button"
          className="btn-export-report"
          onClick={() => exportScheduleToExcelCsv(project, scheduleData)}
        >
          <DownloadOutlinedIcon style={{ fontSize: 16 }} />
          <span>Xuất Excel Tiến độ CPM (.csv)</span>
        </button>
        <button
          type="button"
          className="btn-export-report"
          onClick={() => printExecutiveReport(project, tasks, healthOverview)}
        >
          <PrintOutlinedIcon style={{ fontSize: 16 }} />
          <span>In Báo cáo Tổng hợp (PDF)</span>
        </button>
      </div>

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
            {analytics.memberAllocations?.map((m) => (
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

      <div className="activity-timeline-card">
        <h3>
          <HistoryIcon fontSize="small" style={{ color: '#6366f1' }} />
          <span>Nhật Ký Hoạt Động Dự Án (Audit Log)</span>
        </h3>
        {activities.length === 0 ? (
          <p className="activity-empty">Chưa có lịch sử hoạt động nào được ghi nhận trong dự án này.</p>
        ) : (
          <div className="activity-list">
            {activities.map((act) => (
              <div key={act.id} className="activity-row">
                <UserAvatar
                  name={act.actorName}
                  avatarUrl={act.actorAvatarUrl}
                  size="sm"
                />
                <div className="activity-content">
                  <div className="activity-line">
                    <strong>{act.actorName}</strong>
                    {act.targetCode && <span className="activity-code">{act.targetCode}</span>}
                    <span>{act.description}</span>
                  </div>
                  <div className="activity-time">
                    {new Date(act.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                    · {new Date(act.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
