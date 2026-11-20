using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Activities.DTOs;
using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Features.Activities.Services;

public interface IActivityLogService
{
    Task<IReadOnlyList<ProjectActivityLogDto>> GetProjectActivitiesAsync(Guid projectId, int limit = 40, CancellationToken cancellationToken = default);
    Task LogAsync(
        Guid projectId,
        Guid? actorUserId,
        string action,
        string? targetCode,
        string description,
        CancellationToken cancellationToken = default);
}

public class ActivityLogService : IActivityLogService
{
    private readonly IRepository<ProjectActivityLog> _activityRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ActivityLogService(
        IRepository<ProjectActivityLog> activityRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork)
    {
        _activityRepository = activityRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProjectActivityLogDto>> GetProjectActivitiesAsync(Guid projectId, int limit = 40, CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 100);
        var items = await _activityRepository.FindAsync(a => a.ProjectId == projectId, cancellationToken);
        return items
            .OrderByDescending(a => a.CreatedAt)
            .Take(safeLimit)
            .Select(a => new ProjectActivityLogDto(
                a.Id,
                a.ProjectId,
                a.ActorId,
                a.ActorName,
                a.ActorAvatarUrl,
                a.Action,
                a.TargetCode,
                a.Description,
                a.CreatedAt
            ))
            .ToList();
    }

    public async Task LogAsync(
        Guid projectId,
        Guid? actorUserId,
        string action,
        string? targetCode,
        string description,
        CancellationToken cancellationToken = default)
    {
        User? actor = actorUserId.HasValue
            ? await _userRepository.GetByIdAsync(actorUserId.Value, cancellationToken)
            : null;

        var entry = new ProjectActivityLog
        {
            ProjectId = projectId,
            ActorId = actorUserId,
            ActorName = actor?.FullName ?? "Hệ thống",
            ActorAvatarUrl = actor?.AvatarUrl,
            Action = action,
            TargetCode = targetCode,
            Description = description
        };

        await _activityRepository.AddAsync(entry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
