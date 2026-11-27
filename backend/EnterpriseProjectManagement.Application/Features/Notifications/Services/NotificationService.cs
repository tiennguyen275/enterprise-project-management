using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Notifications.DTOs;
using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Features.Notifications.Services;

public interface INotificationService
{
    Task<NotificationsOverviewDto> GetMyNotificationsAsync(Guid userId, int limit = 25, CancellationToken cancellationToken = default);
    Task<UserNotificationDto> CreateNotificationAsync(
        Guid targetUserId,
        string title,
        string message,
        string type,
        string? linkUrl,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class NotificationService : INotificationService
{
    private readonly IRepository<UserNotification> _notificationRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealtimeNotificationService _realtimeNotificationService;

    public NotificationService(
        IRepository<UserNotification> notificationRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork,
        IRealtimeNotificationService realtimeNotificationService)
    {
        _notificationRepository = notificationRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _realtimeNotificationService = realtimeNotificationService;
    }

    public async Task<NotificationsOverviewDto> GetMyNotificationsAsync(Guid userId, int limit = 25, CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var all = await _notificationRepository.FindAsync(n => n.UserId == userId, cancellationToken);
        var unreadCount = all.Count(n => !n.IsRead);

        var items = all
            .OrderByDescending(n => n.CreatedAt)
            .Take(safeLimit)
            .Select(MapDto)
            .ToList();

        return new NotificationsOverviewDto(unreadCount, items);
    }

    public async Task<UserNotificationDto> CreateNotificationAsync(
        Guid targetUserId,
        string title,
        string message,
        string type,
        string? linkUrl,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        User? actor = actorUserId.HasValue
            ? await _userRepository.GetByIdAsync(actorUserId.Value, cancellationToken)
            : null;

        var entity = new UserNotification
        {
            UserId = targetUserId,
            Title = title,
            Message = message,
            Type = type,
            LinkUrl = linkUrl,
            IsRead = false,
            ActorName = actor?.FullName ?? "Hệ thống EPMS",
            ActorAvatarUrl = actor?.AvatarUrl
        };

        await _notificationRepository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = MapDto(entity);
        await _realtimeNotificationService.NotifyUserNotificationAsync(targetUserId, dto, cancellationToken);
        return dto;
    }

    public async Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        var entity = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (entity == null || entity.UserId != userId) return;

        if (!entity.IsRead)
        {
            entity.IsRead = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _notificationRepository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var unread = await _notificationRepository.FindAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);
        if (unread.Count == 0) return;

        var now = DateTime.UtcNow;
        foreach (var item in unread)
        {
            item.IsRead = true;
            item.UpdatedAt = now;
            await _notificationRepository.UpdateAsync(item, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static UserNotificationDto MapDto(UserNotification entity) =>
        new(
            entity.Id,
            entity.Title,
            entity.Message,
            entity.Type,
            entity.LinkUrl,
            entity.IsRead,
            entity.ActorName,
            entity.ActorAvatarUrl,
            entity.CreatedAt
        );
}

