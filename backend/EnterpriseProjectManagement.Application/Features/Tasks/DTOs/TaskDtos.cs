using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Tasks.DTOs;

public record CreateTaskRequestDto(
    Guid ProjectId,
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTime? DueDate,
    decimal? EstimatedHours,
    Guid? AssigneeId,
    Guid? ParentTaskId
);

public record UpdateTaskRequestDto(
    string Title,
    string? Description,
    ProjectTaskStatus Status,
    TaskPriority Priority,
    DateTime? DueDate,
    decimal? EstimatedHours,
    decimal? ActualHours,
    Guid? AssigneeId
);

public record SubTaskSummaryDto(
    Guid Id,
    string TaskCode,
    string Title,
    ProjectTaskStatus Status
);

public record TaskCommentDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    string Content,
    DateTime CreatedAt
);

public record TaskResponseDto(
    Guid Id,
    Guid ProjectId,
    string TaskCode,
    string Title,
    string? Description,
    ProjectTaskStatus Status,
    TaskPriority Priority,
    DateTime? DueDate,
    decimal? EstimatedHours,
    decimal? ActualHours,
    Guid? AssigneeId,
    string? AssigneeName,
    Guid? ParentTaskId,
    DateTime CreatedAt,
    List<SubTaskSummaryDto> SubTasks,
    List<TaskCommentDto> Comments
);

public record MyTaskResponseDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    string ProjectCode,
    string TaskCode,
    string Title,
    string? Description,
    ProjectTaskStatus Status,
    TaskPriority Priority,
    DateTime? DueDate,
    decimal? EstimatedHours,
    decimal? ActualHours,
    Guid? AssigneeId,
    string? AssigneeName,
    DateTime CreatedAt,
    int CommentCount,
    bool IsOverdue
);

public record AssignTaskRequestDto(
    Guid? AssigneeId
);

public record CreateCommentRequestDto(
    string Content
);
