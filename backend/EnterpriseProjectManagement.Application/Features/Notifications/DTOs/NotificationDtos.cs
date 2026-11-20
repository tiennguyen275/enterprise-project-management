namespace EnterpriseProjectManagement.Application.Features.Notifications.DTOs;

public record UserNotificationDto(
    Guid Id,
    string Title,
    string Message,
    string Type,
    string? LinkUrl,
    bool IsRead,
    string? ActorName,
    string? ActorAvatarUrl,
    DateTime CreatedAt
);

public record NotificationsOverviewDto(
    int UnreadCount,
    IReadOnlyList<UserNotificationDto> Items
);

