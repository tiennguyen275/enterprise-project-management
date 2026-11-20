using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Users.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Users.Services;

public interface IUserService
{
    Task<IReadOnlyList<UserDirectoryItemDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<UserDirectoryItemDto?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserDirectoryItemDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default);
    Task<UserDirectoryItemDto> UpdateUserRoleAsync(Guid adminUserId, Guid targetUserId, SystemRole newRole, CancellationToken cancellationToken = default);
    Task<UserDirectoryItemDto> ToggleUserActiveAsync(Guid adminUserId, Guid targetUserId, bool isActive, CancellationToken cancellationToken = default);
}

public class UserService : IUserService
{
    private const int MaxAvatarLength = 350_000;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<ProjectMember> _memberRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        IRepository<User> userRepository,
        IRepository<ProjectMember> memberRepository,
        IRepository<ProjectTask> taskRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _memberRepository = memberRepository;
        _taskRepository = taskRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<UserDirectoryItemDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var memberships = await _memberRepository.GetAllAsync(cancellationToken);
        var tasks = await _taskRepository.FindAsync(t => t.ParentTaskId == null && t.AssigneeId != null, cancellationToken);

        var projectCounts = memberships
            .GroupBy(m => m.UserId)
            .ToDictionary(g => g.Key, g => g.Select(m => m.ProjectId).Distinct().Count());

        var taskCounts = tasks
            .Where(t => t.AssigneeId.HasValue)
            .GroupBy(t => t.AssigneeId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        return users
            .OrderByDescending(u => u.SystemRole)
            .ThenBy(u => u.FullName)
            .Select(u => new UserDirectoryItemDto(
                u.Id,
                u.Email,
                u.FullName,
                u.AvatarUrl,
                u.SystemRole.ToString(),
                u.IsActive,
                u.CreatedAt,
                projectCounts.TryGetValue(u.Id, out var pCount) ? pCount : 0,
                taskCounts.TryGetValue(u.Id, out var tCount) ? tCount : 0
            ))
            .ToList();
    }

    public async Task<UserDirectoryItemDto?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null) return null;

        return await MapSingleUserAsync(user, cancellationToken);
    }

    public async Task<UserDirectoryItemDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var fullName = request.FullName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Length > 100)
        {
            throw new InvalidOperationException("Họ và tên không được để trống và tối đa 100 ký tự.");
        }

        string? normalizedAvatar = null;
        if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            var trimmedAvatar = request.AvatarUrl.Trim();
            if (trimmedAvatar.Length > MaxAvatarLength)
            {
                throw new InvalidOperationException("Ảnh đại diện quá lớn. Vui lòng chọn ảnh nhỏ hơn.");
            }

            var isAllowedUri = trimmedAvatar.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || trimmedAvatar.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || trimmedAvatar.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase);

            if (!isAllowedUri)
            {
                throw new InvalidOperationException("Định dạng đường dẫn ảnh đại diện không hợp lệ.");
            }

            normalizedAvatar = trimmedAvatar;
        }

        user.FullName = fullName;
        user.AvatarUrl = normalizedAvatar;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapSingleUserAsync(user, cancellationToken);
    }

    public async Task<UserDirectoryItemDto> UpdateUserRoleAsync(Guid adminUserId, Guid targetUserId, SystemRole newRole, CancellationToken cancellationToken = default)
    {
        var admin = await _userRepository.GetByIdAsync(adminUserId, cancellationToken);
        if (admin == null || !admin.IsActive || admin.SystemRole != SystemRole.Admin)
        {
            throw new UnauthorizedAccessException("Chỉ Quản trị viên hệ thống đang hoạt động mới có quyền thay đổi vai trò.");
        }

        if (!Enum.IsDefined(typeof(SystemRole), newRole))
        {
            throw new InvalidOperationException("Vai trò hệ thống không hợp lệ.");
        }

        if (adminUserId == targetUserId && newRole != SystemRole.Admin)
        {
            throw new InvalidOperationException("Bạn không thể tự hạ quyền Admin của chính mình.");
        }

        var target = await _userRepository.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        target.SystemRole = newRole;
        target.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(target, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapSingleUserAsync(target, cancellationToken);
    }

    public async Task<UserDirectoryItemDto> ToggleUserActiveAsync(Guid adminUserId, Guid targetUserId, bool isActive, CancellationToken cancellationToken = default)
    {
        var admin = await _userRepository.GetByIdAsync(adminUserId, cancellationToken);
        if (admin == null || !admin.IsActive || admin.SystemRole != SystemRole.Admin)
        {
            throw new UnauthorizedAccessException("Chỉ Quản trị viên hệ thống đang hoạt động mới có quyền khóa/mở tài khoản.");
        }

        if (adminUserId == targetUserId && !isActive)
        {
            throw new InvalidOperationException("Bạn không thể tự khóa tài khoản của chính mình.");
        }

        var target = await _userRepository.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        target.IsActive = isActive;
        target.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(target, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapSingleUserAsync(target, cancellationToken);
    }

    private async Task<UserDirectoryItemDto> MapSingleUserAsync(User user, CancellationToken cancellationToken)
    {
        var memberships = await _memberRepository.FindAsync(m => m.UserId == user.Id, cancellationToken);
        var tasks = await _taskRepository.FindAsync(t => t.ParentTaskId == null && t.AssigneeId == user.Id, cancellationToken);

        return new UserDirectoryItemDto(
            user.Id,
            user.Email,
            user.FullName,
            user.AvatarUrl,
            user.SystemRole.ToString(),
            user.IsActive,
            user.CreatedAt,
            memberships.Select(m => m.ProjectId).Distinct().Count(),
            tasks.Count
        );
    }
}

