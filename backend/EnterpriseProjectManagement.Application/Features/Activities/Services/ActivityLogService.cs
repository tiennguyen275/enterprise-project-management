using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Activities.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Activities.Services;

public interface IActivityLogService
{
    Task<IReadOnlyList<ProjectActivityLogDto>> GetProjectActivitiesAsync(Guid projectId, Guid requesterUserId, int limit = 40, CancellationToken cancellationToken = default);
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
    private readonly IRepository<ProjectMember> _memberRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ActivityLogService(
        IRepository<ProjectActivityLog> activityRepository,
        IRepository<ProjectMember> memberRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork)
    {
        _activityRepository = activityRepository;
        _memberRepository = memberRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProjectActivityLogDto>> GetProjectActivitiesAsync(Guid projectId, Guid requesterUserId, int limit = 40, CancellationToken cancellationToken = default)
    {
        var requester = await _userRepository.GetByIdAsync(requesterUserId, cancellationToken);
        if (requester == null || !requester.IsActive)
        {
            throw new UnauthorizedAccessException("Tài khoản không hợp lệ hoặc đã bị tạm khóa.");
        }

        if (requester.SystemRole != SystemRole.Admin)
        {
            var memberships = await _memberRepository.FindAsync(m => m.ProjectId == projectId && m.UserId == requesterUserId, cancellationToken);
            if (!memberships.Any())
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem nhật ký hoạt động của dự án này.");
            }
        }

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

