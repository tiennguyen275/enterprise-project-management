namespace EnterpriseProjectManagement.Application.Features.Activities.DTOs;

public record ProjectActivityLogDto(
    Guid Id,
    Guid ProjectId,
    Guid? ActorId,
    string ActorName,
    string? ActorAvatarUrl,
    string Action,
    string? TargetCode,
    string Description,
    DateTime CreatedAt
);
