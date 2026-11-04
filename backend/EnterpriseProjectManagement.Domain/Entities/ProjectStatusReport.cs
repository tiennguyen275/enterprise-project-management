using EnterpriseProjectManagement.Domain.Common;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Domain.Entities;

public class ProjectStatusReport : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public DateTime ReportStartDate { get; set; }
    public DateTime ReportEndDate { get; set; }
    public ProjectHealthRating HealthRating { get; set; } = ProjectHealthRating.OnTrack;

    public string KeyAccomplishments { get; set; } = string.Empty;
    public string? UpcomingPlan { get; set; }
    public string? RisksAndBlockers { get; set; }

    public int TotalTasksSnapshot { get; set; }
    public int CompletedTasksSnapshot { get; set; }
    public int OverdueTasksSnapshot { get; set; }
    public decimal CompletionRateSnapshot { get; set; }
}

