using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Projects.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Projects.Services;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectResponseDto>> GetUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ProjectResponseDto?> GetProjectByIdAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<ProjectResponseDto> CreateProjectAsync(Guid creatorUserId, CreateProjectRequestDto request, CancellationToken cancellationToken = default);
    Task<ProjectResponseDto> UpdateProjectAsync(Guid projectId, UpdateProjectRequestDto request, CancellationToken cancellationToken = default);
    Task DeleteProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task AddMemberAsync(Guid projectId, string email, ProjectRole role, CancellationToken cancellationToken = default);
    Task<ProjectAnalyticsDto> GetProjectAnalyticsAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public class ProjectService : IProjectService
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectMember> _memberRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ProjectService(
        IRepository<Project> projectRepository,
        IRepository<ProjectMember> memberRepository,
        IRepository<User> userRepository,
        IRepository<ProjectTask> taskRepository,
        IUnitOfWork unitOfWork)
    {
        _projectRepository = projectRepository;
        _memberRepository = memberRepository;
        _userRepository = userRepository;
        _taskRepository = taskRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProjectResponseDto>> GetUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var memberships = await _memberRepository.FindAsync(m => m.UserId == userId, cancellationToken);
        var projectIds = memberships.Select(m => m.ProjectId).ToHashSet();

        var projects = await _projectRepository.FindAsync(p => projectIds.Contains(p.Id), cancellationToken);
        var tasks = await _taskRepository.FindAsync(t => projectIds.Contains(t.ProjectId), cancellationToken);

        var result = new List<ProjectResponseDto>();
        foreach (var project in projects)
        {
            var projectTasks = tasks.Where(t => t.ProjectId == project.Id).ToList();
            var totalTasks = projectTasks.Count;
            var completedTasks = projectTasks.Count(t => t.Status == ProjectTaskStatus.Done);

            result.Add(new ProjectResponseDto(
                project.Id,
                project.Name,
                project.Code,
                project.Description,
                project.Status,
                project.StartDate,
                project.EndDate,
                project.CreatedAt,
                totalTasks,
                completedTasks,
                new List<ProjectMemberDto>()
            ));
        }

        return result;
    }

    public async Task<ProjectResponseDto?> GetProjectByIdAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null) return null;

        var members = await _memberRepository.FindAsync(m => m.ProjectId == projectId, cancellationToken);
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId, cancellationToken);

        var memberDtos = (from m in members
                          join u in users on m.UserId equals u.Id
                          select new ProjectMemberDto(u.Id, u.FullName, u.Email, m.Role)).ToList();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Status == ProjectTaskStatus.Done);

        return new ProjectResponseDto(
            project.Id,
            project.Name,
            project.Code,
            project.Description,
            project.Status,
            project.StartDate,
            project.EndDate,
            project.CreatedAt,
            totalTasks,
            completedTasks,
            memberDtos
        );
    }

    public async Task<ProjectResponseDto> CreateProjectAsync(Guid creatorUserId, CreateProjectRequestDto request, CancellationToken cancellationToken = default)
    {
        var existing = await _projectRepository.FindAsync(p => p.Code.ToUpper() == request.Code.ToUpper(), cancellationToken);
        if (existing.Any())
        {
            throw new InvalidOperationException($"Mã dự án '{request.Code}' đã tồn tại.");
        }

        var project = new Project
        {
            Name = request.Name.Trim(),
            Code = request.Code.Trim().ToUpper(),
            Description = request.Description,
            Status = ProjectStatus.Active,
            StartDate = request.StartDate ?? DateTime.UtcNow,
            EndDate = request.EndDate
        };

        await _projectRepository.AddAsync(project, cancellationToken);

        var member = new ProjectMember
        {
            ProjectId = project.Id,
            UserId = creatorUserId,
            Role = ProjectRole.Owner
        };
        await _memberRepository.AddAsync(member, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ProjectResponseDto(
            project.Id,
            project.Name,
            project.Code,
            project.Description,
            project.Status,
            project.StartDate,
            project.EndDate,
            project.CreatedAt,
            0,
            0,
            new List<ProjectMemberDto>()
        );
    }

    public async Task<ProjectResponseDto> UpdateProjectAsync(Guid projectId, UpdateProjectRequestDto request, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null) throw new KeyNotFoundException("Không tìm thấy dự án.");

        project.Name = request.Name.Trim();
        project.Description = request.Description;
        project.Status = request.Status;
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;

        await _projectRepository.UpdateAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await GetProjectByIdAsync(projectId, cancellationToken))!;
    }

    public async Task DeleteProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project != null)
        {
            await _projectRepository.DeleteAsync(project, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddMemberAsync(Guid projectId, string email, ProjectRole role, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == email.Trim().ToLower(), cancellationToken);
        var user = users.FirstOrDefault();
        if (user == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy người dùng có email '{email}'.");
        }

        var existing = await _memberRepository.FindAsync(m => m.ProjectId == projectId && m.UserId == user.Id, cancellationToken);
        if (existing.Any())
        {
            throw new InvalidOperationException("Thành viên này đã ở trong dự án.");
        }

        var member = new ProjectMember
        {
            ProjectId = projectId,
            UserId = user.Id,
            Role = role
        };

        await _memberRepository.AddAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProjectAnalyticsDto> GetProjectAnalyticsAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null) throw new KeyNotFoundException("Không tìm thấy dự án.");

        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId, cancellationToken);
        var members = await _memberRepository.FindAsync(m => m.ProjectId == projectId, cancellationToken);
        var users = await _userRepository.GetAllAsync(cancellationToken);

        var totalTasks = tasks.Count;
        var todoTasks = tasks.Count(t => t.Status == ProjectTaskStatus.Todo);
        var inProgressTasks = tasks.Count(t => t.Status == ProjectTaskStatus.InProgress);
        var inReviewTasks = tasks.Count(t => t.Status == ProjectTaskStatus.InReview);
        var doneTasks = tasks.Count(t => t.Status == ProjectTaskStatus.Done);

        var completionRate = totalTasks > 0 ? Math.Round((decimal)doneTasks / totalTasks * 100, 1) : 0;

        var memberAllocations = new List<MemberTaskAllocationDto>();
        foreach (var m in members)
        {
            var user = users.FirstOrDefault(u => u.Id == m.UserId);
            if (user == null) continue;

            var memberTasks = tasks.Where(t => t.AssigneeId == user.Id).ToList();
            var memberTotal = memberTasks.Count;
            var memberDone = memberTasks.Count(t => t.Status == ProjectTaskStatus.Done);
            var allocation = totalTasks > 0 ? Math.Round((decimal)memberTotal / totalTasks * 100, 1) : 0;

            memberAllocations.Add(new MemberTaskAllocationDto(
                user.Id,
                user.FullName,
                user.Email,
                memberTotal,
                memberDone,
                allocation
            ));
        }

        return new ProjectAnalyticsDto(
            project.Id,
            project.Name,
            totalTasks,
            todoTasks,
            inProgressTasks,
            inReviewTasks,
            doneTasks,
            completionRate,
            memberAllocations
        );
    }
}
