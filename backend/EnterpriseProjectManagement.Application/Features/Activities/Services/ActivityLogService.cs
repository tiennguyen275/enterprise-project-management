using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Activities.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Activities.Services;

public interface IActivityLogService
{
    Task<IReadOnlyList<ProjectActivityLogDto>> GetProjectActivitiesAsync(Guid projectId, Guid requesterUserId, int limit = 40, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProjectActivityLogDto>> GetTaskActivitiesAsync(Guid taskId, Guid requesterUserId, int limit = 50, CancellationToken cancellationToken = default);
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
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ActivityLogService(
        IRepository<ProjectActivityLog> activityRepository,
        IRepository<ProjectMember> memberRepository,
        IRepository<ProjectTask> taskRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork)
    {
        _activityRepository = activityRepository;
        _memberRepository = memberRepository;
        _taskRepository = taskRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProjectActivityLogDto>> GetProjectActivitiesAsync(Guid projectId, Guid requesterUserId, int limit = 40, CancellationToken cancellationToken = default)
    {
        await EnsureCanAccessProjectAsync(projectId, requesterUserId, cancellationToken);

        var safeLimit = Math.Clamp(limit, 1, 100);
        var items = await _activityRepository.FindAsync(a => a.ProjectId == projectId, cancellationToken);
        return items
            .OrderByDescending(a => a.CreatedAt)
            .Take(safeLimit)
            .Select(MapDto)
            .ToList();
    }

    public async Task<IReadOnlyList<ProjectActivityLogDto>> GetTaskActivitiesAsync(Guid taskId, Guid requesterUserId, int limit = 50, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy công việc.");

        await EnsureCanAccessProjectAsync(task.ProjectId, requesterUserId, cancellationToken);

        var safeLimit = Math.Clamp(limit, 1, 100);
        var items = await _activityRepository.FindAsync(
            a => a.ProjectId == task.ProjectId && a.TargetCode == task.TaskCode,
            cancellationToken);

        return items
            .OrderByDescending(a => a.CreatedAt)
            .Take(safeLimit)
            .Select(MapDto)
            .ToList();
    }

    private async Task EnsureCanAccessProjectAsync(Guid projectId, Guid requesterUserId, CancellationToken cancellationToken)
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
    }

    private static ProjectActivityLogDto MapDto(ProjectActivityLog a) =>
        new(
            a.Id,
            a.ProjectId,
            a.ActorId,
            a.ActorName,
            a.ActorAvatarUrl,
            a.Action,
            a.TargetCode,
            a.Description,
            a.CreatedAt
        );

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

