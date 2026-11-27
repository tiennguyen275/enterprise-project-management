namespace EnterpriseProjectManagement.Application.Features.Projects.DTOs;

public record MemberTaskAllocationDto(
    Guid UserId,
    string FullName,
    string Email,
    int TotalTasks,
    int CompletedTasks,
    decimal AllocationPercentage
);

public record ProjectAnalyticsDto(
    Guid ProjectId,
    string ProjectName,
    int TotalTasks,
    int TodoTasks,
    int InProgressTasks,
    int InReviewTasks,
    int DoneTasks,
    decimal CompletionRate,
    List<MemberTaskAllocationDto> MemberAllocations
);
