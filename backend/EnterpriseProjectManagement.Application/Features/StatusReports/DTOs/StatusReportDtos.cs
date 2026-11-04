using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.StatusReports.DTOs;

public record ProjectHealthOverviewDto(
    Guid ProjectId,
    string ProjectName,
    ProjectHealthRating SuggestedRating,
    string HealthSummary,
    int TotalTasks,
    int CompletedTasks,
    int InProgressTasks,
    int OverdueTasks,
    int OutOfRangeTasks,
    decimal CompletionRate,
    IReadOnlyList<StatusReportResponseDto> Reports
);

public record StatusReportResponseDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    DateTime ReportStartDate,
    DateTime ReportEndDate,
    ProjectHealthRating HealthRating,
    string KeyAccomplishments,
    string? UpcomingPlan,
    string? RisksAndBlockers,
    int TotalTasksSnapshot,
    int CompletedTasksSnapshot,
    int OverdueTasksSnapshot,
    decimal CompletionRateSnapshot,
    string AuthorName,
    DateTime CreatedAt
);

public record CreateStatusReportRequestDto(
    Guid ProjectId,
    string Title,
    DateTime ReportStartDate,
    DateTime ReportEndDate,
    ProjectHealthRating HealthRating,
    string KeyAccomplishments,
    string? UpcomingPlan,
    string? RisksAndBlockers,
    bool SkipOutOfRangeWarning = false
);

