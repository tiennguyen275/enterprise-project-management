const STATUS_LABELS = {
  1: 'Cần làm (Todo)',
  2: 'Đang làm (In Progress)',
  3: 'Chờ duyệt (In Review)',
  4: 'Hoàn thành (Done)',
};

const PRIORITY_LABELS = {
  1: 'Thấp',
  2: 'Trung bình',
  3: 'Cao',
  4: 'Khẩn cấp',
};

function escapeCsvCell(value) {
  const str = value == null ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsvFile(filename, headers, rows) {
  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ];
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTasksToExcelCsv(project, tasks = []) {
  const headers = [
    'Mã công việc',
    'Tên công việc',
    'Trạng thái',
    'Độ ưu tiên',
    'Người thực hiện',
    'Giờ ước lượng (h)',
    'Giờ thực tế (h)',
    'Hạn hoàn thành',
  ];
  const rows = tasks.map((t) => [
    t.taskCode,
    t.title,
    STATUS_LABELS[t.status] || t.status,
    PRIORITY_LABELS[t.priority] || t.priority,
    t.assigneeName || 'Chưa phân công',
    t.estimatedHours ?? 0,
    t.actualHours ?? 0,
    t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '',
  ]);
  const safeCode = (project?.code || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadCsvFile(`${safeCode}_BaoCao_CongViec.csv`, headers, rows);
}

export function exportScheduleToExcelCsv(project, scheduleData) {
  const items = scheduleData?.schedule || [];
  const headers = [
    'Mã việc',
    'Tên công việc',
    'Phụ trách',
    'Thời lượng (ngày)',
    'ES',
    'EF',
    'LS',
    'LF',
    'Độ trôi (Float)',
    'Đường găng (CPM)',
  ];
  const rows = items.map((item) => [
    item.taskCode,
    item.title,
    item.assigneeName || 'Chưa phân công',
    item.durationDays,
    `N${item.earlyStartDay}`,
    `N${item.earlyFinishDay}`,
    `N${item.lateStartDay}`,
    `N${item.lateFinishDay}`,
    `${item.totalFloatDays} ngày`,
    item.isCritical ? 'Đường găng' : 'Có dự trữ',
  ]);
  const safeCode = (project?.code || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadCsvFile(`${safeCode}_TienDo_CPM.csv`, headers, rows);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printExecutiveReport(project, tasks = [], healthOverview = null) {
  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) return;

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 4).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  const rowsHtml = tasks
    .map(
      (t) => `
      <tr>
        <td><code>${escapeHtml(t.taskCode)}</code></td>
        <td>${escapeHtml(t.title)}</td>
        <td>${escapeHtml(STATUS_LABELS[t.status] || '')}</td>
        <td>${escapeHtml(PRIORITY_LABELS[t.priority] || '')}</td>
        <td>${escapeHtml(t.assigneeName || 'Chưa phân công')}</td>
        <td>${t.actualHours ?? 0}h / ${t.estimatedHours ?? 0}h</td>
      </tr>`
    )
    .join('');

  win.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Báo cáo Dự án - ${escapeHtml(project?.name)}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 32px; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .kpi-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .kpi { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; }
    .kpi span { display: block; font-size: 12px; color: #64748b; }
    .kpi strong { font-size: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; }
    code { background: #eff6ff; color: #1d4ed8; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Báo cáo Tổng hợp Dự án: ${escapeHtml(project?.name)} (${escapeHtml(project?.code)})</h1>
  <div class="meta">Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} · ${escapeHtml(project?.description || '')}</div>
  <div class="kpi-row">
    <div class="kpi"><span>Tổng công việc</span><strong>${total}</strong></div>
    <div class="kpi"><span>Hoàn thành</span><strong>${done}</strong></div>
    <div class="kpi"><span>Tỷ lệ hoàn tất</span><strong>${rate}%</strong></div>
    <div class="kpi"><span>Công việc quá hạn</span><strong>${healthOverview?.overdueTasks ?? 0}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Mã việc</th>
        <th>Tên công việc</th>
        <th>Trạng thái</th>
        <th>Ưu tiên</th>
        <th>Người phụ trách</th>
        <th>Thời gian</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
}
