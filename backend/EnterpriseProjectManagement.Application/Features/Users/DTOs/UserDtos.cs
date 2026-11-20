using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Users.DTOs;

public record UserDirectoryItemDto(
    Guid Id,
    string Email,
    string FullName,
    string? AvatarUrl,
    string SystemRole,
    bool IsActive,
    DateTime CreatedAt,
    int ProjectCount,
    int AssignedTaskCount
);

public record UpdateProfileRequestDto(
    string FullName,
    string? AvatarUrl
);

public record UpdateUserRoleRequestDto(
    SystemRole SystemRole
);

public record ToggleUserActiveRequestDto(
    bool IsActive
);

