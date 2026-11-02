using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Projects.DTOs;

public record CreateProjectRequestDto(
    string Name,
    string Code,
    string? Description,
    DateTime? StartDate,
    DateTime? EndDate
);

public record UpdateProjectRequestDto(
    string Name,
    string? Description,
    ProjectStatus Status,
    DateTime? StartDate,
    DateTime? EndDate
);

public record ProjectMemberDto(
    Guid UserId,
    string FullName,
    string Email,
    ProjectRole Role
);

public record ProjectResponseDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    ProjectStatus Status,
    DateTime? StartDate,
    DateTime? EndDate,
    DateTime CreatedAt,
    int TotalTasks,
    int CompletedTasks,
    List<ProjectMemberDto> Members
);

