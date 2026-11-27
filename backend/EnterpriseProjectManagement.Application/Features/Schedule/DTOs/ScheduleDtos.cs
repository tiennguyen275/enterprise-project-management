namespace EnterpriseProjectManagement.Application.Features.Schedule.DTOs;

public record TaskDependencyDto(
    Guid Id,
    Guid ProjectId,
    Guid PredecessorTaskId,
    string PredecessorCode,
    string PredecessorTitle,
    Guid SuccessorTaskId,
    string SuccessorCode,
    string SuccessorTitle,
    int LagDays
);

public record CreateTaskDependencyRequestDto(
    Guid PredecessorTaskId,
    Guid SuccessorTaskId,
    int LagDays = 0
);

public record CpmTaskScheduleDto(
    Guid TaskId,
    string TaskCode,
    string Title,
    int Status,
    int Priority,
    decimal? EstimatedHours,
    decimal? ActualHours,
    DateTime? DueDate,
    string? AssigneeName,
    int DurationDays,
    int EarlyStartDay,
    int EarlyFinishDay,
    int LateStartDay,
    int LateFinishDay,
    int TotalFloatDays,
    bool IsCritical,
    DateTime CalculatedStartDate,
    DateTime CalculatedEndDate,
    IReadOnlyList<Guid> PredecessorTaskIds
);

public record ProjectCpmScheduleResponseDto(
    Guid ProjectId,
    string ProjectCode,
    string ProjectName,
    DateTime ProjectStartDate,
    int TotalProjectDays,
    DateTime ProjectedEndDate,
    int CriticalTasksCount,
    IReadOnlyList<CpmTaskScheduleDto> Schedule,
    IReadOnlyList<TaskDependencyDto> Dependencies
);
