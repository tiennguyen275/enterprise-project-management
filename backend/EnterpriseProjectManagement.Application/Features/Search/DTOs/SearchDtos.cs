using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Search.DTOs;

public record SearchProjectHitDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    ProjectStatus Status
);

public record SearchTaskHitDto(
    Guid Id,
    Guid ProjectId,
    string ProjectCode,
    string TaskCode,
    string Title,
    ProjectTaskStatus Status,
    TaskPriority Priority,
    string? AssigneeName,
    string? AssigneeAvatarUrl
);

public record SearchUserHitDto(
    Guid Id,
    string FullName,
    string Email,
    string? AvatarUrl,
    string SystemRole
);

public record GlobalSearchResponseDto(
    IReadOnlyList<SearchProjectHitDto> Projects,
    IReadOnlyList<SearchTaskHitDto> Tasks,
    IReadOnlyList<SearchUserHitDto> Users
);

