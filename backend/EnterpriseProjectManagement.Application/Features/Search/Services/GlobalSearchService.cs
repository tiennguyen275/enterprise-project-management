using System.Globalization;
using System.Text;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Search.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Search.Services;

public interface IGlobalSearchService
{
    Task<GlobalSearchResponseDto> SearchAsync(Guid userId, string? query, int limit = 6, CancellationToken cancellationToken = default);
}

public class GlobalSearchService : IGlobalSearchService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectMember> _memberRepository;
    private readonly IRepository<ProjectTask> _taskRepository;

    public GlobalSearchService(
        IRepository<User> userRepository,
        IRepository<Project> projectRepository,
        IRepository<ProjectMember> memberRepository,
        IRepository<ProjectTask> taskRepository)
    {
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _memberRepository = memberRepository;
        _taskRepository = taskRepository;
    }

    public async Task<GlobalSearchResponseDto> SearchAsync(Guid userId, string? query, int limit = 6, CancellationToken cancellationToken = default)
    {
        var normalizedQuery = NormalizeVietnamese(query);
        if (string.IsNullOrEmpty(normalizedQuery))
        {
            return new GlobalSearchResponseDto(
                Array.Empty<SearchProjectHitDto>(),
                Array.Empty<SearchTaskHitDto>(),
                Array.Empty<SearchUserHitDto>()
            );
        }

        var safeLimit = Math.Clamp(limit, 1, 15);
        var currentUser = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (currentUser is null || !currentUser.IsActive)
        {
            return new GlobalSearchResponseDto(
                Array.Empty<SearchProjectHitDto>(),
                Array.Empty<SearchTaskHitDto>(),
                Array.Empty<SearchUserHitDto>()
            );
        }

        var isAdmin = currentUser.SystemRole == SystemRole.Admin;

        IReadOnlyList<Project> accessibleProjects;
        if (isAdmin)
        {
            accessibleProjects = await _projectRepository.GetAllAsync(cancellationToken);
        }
        else
        {
            var memberships = await _memberRepository.FindAsync(m => m.UserId == userId, cancellationToken);
            var memberProjectIds = memberships.Select(m => m.ProjectId).ToHashSet();
            accessibleProjects = memberProjectIds.Count > 0
                ? await _projectRepository.FindAsync(p => memberProjectIds.Contains(p.Id), cancellationToken)
                : Array.Empty<Project>();
        }

        var projectMap = accessibleProjects.ToDictionary(p => p.Id, p => p);
        var accessibleProjectIds = projectMap.Keys.ToHashSet();

        var projectHits = accessibleProjects
            .Where(p =>
                NormalizeVietnamese(p.Name).Contains(normalizedQuery) ||
                NormalizeVietnamese(p.Code).Contains(normalizedQuery) ||
                NormalizeVietnamese(p.Description).Contains(normalizedQuery))
            .OrderByDescending(p => p.CreatedAt)
            .Take(safeLimit)
            .Select(p => new SearchProjectHitDto(p.Id, p.Code, p.Name, p.Description, p.Status))
            .ToList();

        var allUsers = await _userRepository.GetAllAsync(cancellationToken);
        var userMap = allUsers.ToDictionary(u => u.Id, u => u);

        var accessibleTasks = accessibleProjectIds.Count > 0
            ? await _taskRepository.FindAsync(t => accessibleProjectIds.Contains(t.ProjectId) && t.ParentTaskId == null, cancellationToken)
            : Array.Empty<ProjectTask>();

        var taskHits = accessibleTasks
            .Where(t =>
            {
                var assigneeName = t.AssigneeId.HasValue && userMap.TryGetValue(t.AssigneeId.Value, out var u) ? u.FullName : null;
                return NormalizeVietnamese(t.Title).Contains(normalizedQuery) ||
                       NormalizeVietnamese(t.TaskCode).Contains(normalizedQuery) ||
                       NormalizeVietnamese(assigneeName).Contains(normalizedQuery);
            })
            .OrderByDescending(t => t.CreatedAt)
            .Take(safeLimit)
            .Select(t =>
            {
                var assignee = t.AssigneeId.HasValue && userMap.TryGetValue(t.AssigneeId.Value, out var u) ? u : null;
                var projCode = projectMap.TryGetValue(t.ProjectId, out var p) ? p.Code : string.Empty;
                return new SearchTaskHitDto(
                    t.Id,
                    t.ProjectId,
                    projCode,
                    t.TaskCode,
                    t.Title,
                    t.Status,
                    t.Priority,
                    assignee?.FullName,
                    assignee?.AvatarUrl
                );
            })
            .ToList();

        var userHits = allUsers
            .Where(u => u.IsActive && (
                NormalizeVietnamese(u.FullName).Contains(normalizedQuery) ||
                NormalizeVietnamese(u.Email).Contains(normalizedQuery)))
            .OrderByDescending(u => u.SystemRole)
            .ThenBy(u => u.FullName)
            .Take(safeLimit)
            .Select(u => new SearchUserHitDto(u.Id, u.FullName, u.Email, u.AvatarUrl, u.SystemRole.ToString()))
            .ToList();

        return new GlobalSearchResponseDto(projectHits, taskHits, userHits);
    }

    private static string NormalizeVietnamese(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var formD = input.Trim().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var ch in formD)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(ch);
            }
        }

        return sb.ToString()
            .Normalize(NormalizationForm.FormC)
            .Replace('đ', 'd')
            .Replace('Đ', 'd')
            .ToLowerInvariant();
    }
}

