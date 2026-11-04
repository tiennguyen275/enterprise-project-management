using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.StatusReports.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.StatusReports.Services;

public interface IStatusReportService
{
    Task<ProjectHealthOverviewDto> GetProjectHealthAndReportsAsync(
        Guid projectId,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default);

    Task<StatusReportResponseDto> CreateStatusReportAsync(
        Guid userId,
        CreateStatusReportRequestDto request,
        CancellationToken cancellationToken = default);

    Task DeleteStatusReportAsync(Guid reportId, CancellationToken cancellationToken = default);
}

public class StatusReportService : IStatusReportService
{
    private readonly IRepository<ProjectStatusReport> _reportRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public StatusReportService(
        IRepository<ProjectStatusReport> reportRepository,
        IRepository<Project> projectRepository,
        IRepository<ProjectTask> taskRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork)
    {
        _reportRepository = reportRepository;
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ProjectHealthOverviewDto> GetProjectHealthAndReportsAsync(
        Guid projectId,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new KeyNotFoundException("Không tìm thấy dự án.");
        }

        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId, cancellationToken);
        var reports = await _reportRepository.FindAsync(r => r.ProjectId == projectId, cancellationToken);

        var authorIds = reports
            .Where(r => !string.IsNullOrWhiteSpace(r.CreatedBy) && Guid.TryParse(r.CreatedBy, out _))
            .Select(r => Guid.Parse(r.CreatedBy!))
            .Distinct()
            .ToList();

        var userDict = new Dictionary<string, string>();
        if (authorIds.Count > 0)
        {
            var users = await _userRepository.FindAsync(u => authorIds.Contains(u.Id), cancellationToken);
            userDict = users.ToDictionary(u => u.Id.ToString(), u => u.FullName);
        }

        var today = DateTime.UtcNow.Date;
        var (totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate) = CalculateTaskMetrics(tasks, today);

        var normalizedStart = startDate?.Date;
        var normalizedEnd = endDate?.Date;
        var outOfRangeTasks = 0;

        if (normalizedStart.HasValue || normalizedEnd.HasValue)
        {
            outOfRangeTasks = tasks.Count(t =>
                (normalizedStart.HasValue && t.CreatedAt.Date < normalizedStart.Value) ||
                (normalizedEnd.HasValue && t.CreatedAt.Date > normalizedEnd.Value));
        }

        var (suggestedRating, healthSummary) = EvaluateProjectHealth(project, totalTasks, completedTasks, overdueTasks, completionRate, today);

        var reportDtos = reports
            .OrderByDescending(r => r.ReportEndDate)
            .ThenByDescending(r => r.CreatedAt)
            .Select(r => new StatusReportResponseDto(
                r.Id,
                r.ProjectId,
                r.Title,
                r.ReportStartDate,
                r.ReportEndDate,
                r.HealthRating,
                r.KeyAccomplishments,
                r.UpcomingPlan,
                r.RisksAndBlockers,
                r.TotalTasksSnapshot,
                r.CompletedTasksSnapshot,
                r.OverdueTasksSnapshot,
                r.CompletionRateSnapshot,
                r.CreatedBy != null && userDict.TryGetValue(r.CreatedBy, out var author) ? author : "Quản lý dự án",
                r.CreatedAt
            ))
            .ToList();

        return new ProjectHealthOverviewDto(
            project.Id,
            project.Name,
            suggestedRating,
            healthSummary,
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            outOfRangeTasks,
            completionRate,
            reportDtos
        );
    }

    public async Task<StatusReportResponseDto> CreateStatusReportAsync(
        Guid userId,
        CreateStatusReportRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new InvalidOperationException("Tiêu đề báo cáo không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.KeyAccomplishments))
        {
            throw new InvalidOperationException("Nội dung kết quả đạt được không được để trống.");
        }

        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new KeyNotFoundException("Không tìm thấy dự án.");
        }

        var startDate = request.ReportStartDate.Date;
        var endDate = request.ReportEndDate.Date;

        if (endDate < startDate)
        {
            throw new InvalidOperationException("Ngày kết thúc kỳ báo cáo không được nhỏ hơn ngày bắt đầu.");
        }

        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == request.ProjectId, cancellationToken);

        if (!request.SkipOutOfRangeWarning)
        {
            var hasOutOfRange = tasks.Any(t => t.CreatedAt.Date < startDate || t.CreatedAt.Date > endDate);
            if (hasOutOfRange)
            {
                throw new InvalidOperationException("HAVE_TASK_OUT_OF_RANGE: Có công việc nằm ngoài khoảng thời gian kỳ báo cáo đã chọn.");
            }
        }

        var today = DateTime.UtcNow.Date;
        var (totalTasks, completedTasks, _, overdueTasks, completionRate) = CalculateTaskMetrics(tasks, today);

        var report = new ProjectStatusReport
        {
            ProjectId = request.ProjectId,
            Title = request.Title.Trim(),
            ReportStartDate = startDate,
            ReportEndDate = endDate,
            HealthRating = request.HealthRating,
            KeyAccomplishments = request.KeyAccomplishments.Trim(),
            UpcomingPlan = string.IsNullOrWhiteSpace(request.UpcomingPlan) ? null : request.UpcomingPlan.Trim(),
            RisksAndBlockers = string.IsNullOrWhiteSpace(request.RisksAndBlockers) ? null : request.RisksAndBlockers.Trim(),
            TotalTasksSnapshot = totalTasks,
            CompletedTasksSnapshot = completedTasks,
            OverdueTasksSnapshot = overdueTasks,
            CompletionRateSnapshot = completionRate,
            CreatedBy = userId.ToString()
        };

        await _reportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);

        return new StatusReportResponseDto(
            report.Id,
            report.ProjectId,
            report.Title,
            report.ReportStartDate,
            report.ReportEndDate,
            report.HealthRating,
            report.KeyAccomplishments,
            report.UpcomingPlan,
            report.RisksAndBlockers,
            report.TotalTasksSnapshot,
            report.CompletedTasksSnapshot,
            report.OverdueTasksSnapshot,
            report.CompletionRateSnapshot,
            user?.FullName ?? "Quản lý dự án",
            report.CreatedAt
        );
    }

    public async Task DeleteStatusReportAsync(Guid reportId, CancellationToken cancellationToken = default)
    {
        var report = await _reportRepository.GetByIdAsync(reportId, cancellationToken);
        if (report != null)
        {
            await _reportRepository.DeleteAsync(report, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    private static (ProjectHealthRating Rating, string Summary) EvaluateProjectHealth(
        Project project,
        int totalTasks,
        int completedTasks,
        int overdueTasks,
        decimal completionRate,
        DateTime today)
    {
        if (totalTasks == 0)
        {
            return (ProjectHealthRating.OnTrack, "Dự án mới khởi tạo, chưa có công việc phát sinh rủi ro.");
        }

        var overdueRatio = (decimal)overdueTasks / totalTasks * 100;

        if (project.EndDate.HasValue && project.EndDate.Value.Date < today && completedTasks < totalTasks)
        {
            return (ProjectHealthRating.Delayed, $"Dự án đã quá hạn kết thúc dự kiến ({project.EndDate.Value:dd/MM/yyyy}) nhưng còn {totalTasks - completedTasks} công việc chưa hoàn thành.");
        }

        if (overdueRatio >= 25 || overdueTasks >= 3)
        {
            return (ProjectHealthRating.Delayed, $"Cảnh báo đỏ: Có {overdueTasks}/{totalTasks} công việc ({Math.Round(overdueRatio, 1)}%) đang bị quá hạn chót.");
        }

        if (overdueTasks > 0 || (project.EndDate.HasValue && (project.EndDate.Value.Date - today).TotalDays <= 7 && completionRate < 80))
        {
            return (ProjectHealthRating.AtRisk, $"Cần lưu ý: Có {overdueTasks} công việc quá hạn, tiến độ hiện đạt {completionRate}%.");
        }

        return (ProjectHealthRating.OnTrack, $"Tiến độ ổn định ({completionRate}% hoàn thành), không có công việc nào bị trễ hạn.");
    }

    private static (int TotalTasks, int CompletedTasks, int InProgressTasks, int OverdueTasks, decimal CompletionRate) CalculateTaskMetrics(
        IReadOnlyList<ProjectTask> tasks,
        DateTime today)
    {
        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Status == ProjectTaskStatus.Done);
        var inProgressTasks = tasks.Count(t => t.Status == ProjectTaskStatus.InProgress || t.Status == ProjectTaskStatus.InReview);
        var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != ProjectTaskStatus.Done);
        var completionRate = totalTasks > 0 ? Math.Round((decimal)completedTasks / totalTasks * 100, 1) : 0;

        return (totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate);
    }
}
