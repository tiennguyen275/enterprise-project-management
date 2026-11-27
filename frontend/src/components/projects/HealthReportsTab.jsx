import React from 'react';
import FormattedAiText from '../common/FormattedAiText';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

export default function HealthReportsTab({
  healthOverview,
  healthLabels,
  aiInsight,
  aiInsightLoading,
  aiInsightError,
  timeframeFilter,
  onOpenReportModal,
  onRequestInsight,
  onTimeframeChange,
  onClearTimeframe,
  onDeleteReport,
}) {
  if (!healthOverview) return null;

  return (
    <div className="status-reports-layout">
      <div className={`health-overview-banner health-rating-${healthOverview.suggestedRating}`}>
        <div className="health-banner-left">
          <div className="health-status-row">
            <h3>Chẩn Đoán Sức Khỏe Dự Án (R/A/G Health Check)</h3>
            <span className={`health-badge rating-${healthOverview.suggestedRating}`}>
              {healthLabels[healthOverview.suggestedRating]}
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
          <button onClick={onOpenReportModal} className="btn-primary">
            <AddIcon fontSize="small" />
            <span>Lập Báo Cáo Kỳ Này</span>
          </button>
        </div>
      </div>

      <div className="ai-insight-panel">
        <div className="ai-insight-header">
          <div>
            <h4>Nhận xét của trợ lý AI</h4>
            <p>Phân tích số liệu hiện tại của dự án và đề xuất việc nên làm ngay</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRequestInsight}
            disabled={aiInsightLoading}
          >
            {aiInsightLoading ? 'AI đang phân tích...' : aiInsight ? 'Phân tích lại' : 'Phân tích dự án'}
          </button>
        </div>
        {aiInsightError && <p className="ai-error-text">{aiInsightError}</p>}
        {aiInsight && (
          <div className="ai-insight-body">
            <FormattedAiText content={aiInsight.insight} />
            <span>Tạo lúc {new Date(aiInsight.generatedAt).toLocaleTimeString('vi-VN')}</span>
          </div>
        )}
      </div>

      <div className="status-timeframe-bar">
        <div className="timeframe-inputs">
          <label>Kiểm tra khung thời gian báo cáo:</label>
          <input
            type="date"
            value={timeframeFilter.startDate}
            onChange={(e) => onTimeframeChange('startDate', e.target.value)}
          />
          <span>đến</span>
          <input
            type="date"
            value={timeframeFilter.endDate}
            onChange={(e) => onTimeframeChange('endDate', e.target.value)}
          />
          {(timeframeFilter.startDate || timeframeFilter.endDate) && (
            <button type="button" className="btn-secondary" onClick={onClearTimeframe}>
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
          <button onClick={onOpenReportModal} className="btn-primary">
            <AddIcon fontSize="small" />
            <span>Tạo Báo Cáo Trạng Thái Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="status-reports-grid">
          {healthOverview.reports.map((report) => (
            <div key={report.id} className={`status-report-card rating-border-${report.healthRating}`}>
              <div className="report-card-header">
                <div>
                  <span className={`health-badge rating-${report.healthRating}`}>
                    {healthLabels[report.healthRating]}
                  </span>
                  <h4 style={{ marginTop: 8 }}>{report.title}</h4>
                </div>
                <button onClick={() => onDeleteReport(report.id)} className="btn-delete" title="Xóa báo cáo">
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
  );
}
