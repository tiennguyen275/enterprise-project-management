using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Tasks.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.Tasks.Services;

public interface ITaskService
{
    Task<IReadOnlyList<TaskResponseDto>> GetTasksByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MyTaskResponseDto>> GetMyTasksAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TaskResponseDto?> GetTaskByIdAsync(Guid taskId, CancellationToken cancellationToken = default);
    Task<TaskResponseDto> CreateTaskAsync(Guid creatorUserId, CreateTaskRequestDto request, CancellationToken cancellationToken = default);
    Task<TaskResponseDto> UpdateTaskAsync(Guid taskId, UpdateTaskRequestDto request, CancellationToken cancellationToken = default);
    Task<TaskResponseDto> AssignTaskAsync(Guid taskId, Guid? assigneeId, CancellationToken cancellationToken = default);
    Task DeleteTaskAsync(Guid taskId, CancellationToken cancellationToken = default);
    Task<TaskCommentDto> AddCommentAsync(Guid taskId, Guid userId, string content, CancellationToken cancellationToken = default);
}

public class TaskService : ITaskService
{
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<TaskComment> _commentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public TaskService(
        IRepository<ProjectTask> taskRepository,
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        IRepository<TaskComment> commentRepository,
        IUnitOfWork unitOfWork)
    {
        _taskRepository = taskRepository;
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _commentRepository = commentRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TaskResponseDto>> GetTasksByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId, cancellationToken);
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var userDict = users.ToDictionary(u => u.Id, u => u.FullName);

        var result = new List<TaskResponseDto>();
        foreach (var task in tasks.Where(t => t.ParentTaskId == null))
        {
            var subTasks = tasks.Where(s => s.ParentTaskId == task.Id)
                                .Select(s => new SubTaskSummaryDto(s.Id, s.TaskCode, s.Title, s.Status))
                                .ToList();

            var assigneeName = task.AssigneeId.HasValue && userDict.TryGetValue(task.AssigneeId.Value, out var name) ? name : null;

            result.Add(new TaskResponseDto(
                task.Id,
                task.ProjectId,
                task.TaskCode,
                task.Title,
                task.Description,
                task.Status,
                task.Priority,
                task.DueDate,
                task.EstimatedHours,
                task.ActualHours,
                task.AssigneeId,
                assigneeName,
                task.ParentTaskId,
                task.CreatedAt,
                subTasks,
                new List<TaskCommentDto>()
            ));
        }

        return result;
    }

    public async Task<IReadOnlyList<MyTaskResponseDto>> GetMyTasksAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var userStr = userId.ToString();
        var tasks = await _taskRepository.FindAsync(
            t => t.AssigneeId == userId || (t.AssigneeId == null && t.CreatedBy == userStr), 
            cancellationToken);

        var projects = await _projectRepository.GetAllAsync(cancellationToken);
        var projectDict = projects.ToDictionary(p => p.Id, p => (Name: p.Name, Code: p.Code));

        var users = await _userRepository.GetAllAsync(cancellationToken);
        var userDict = users.ToDictionary(u => u.Id, u => u.FullName);

        var allComments = await _commentRepository.GetAllAsync(cancellationToken);
        var commentCounts = allComments.GroupBy(c => c.TaskId).ToDictionary(g => g.Key, g => g.Count());

        var today = DateTime.UtcNow.Date;
        var result = new List<MyTaskResponseDto>();

        foreach (var task in tasks)
        {
            var projName = projectDict.TryGetValue(task.ProjectId, out var pInfo) ? pInfo.Name : "Dự án";
            var projCode = projectDict.TryGetValue(task.ProjectId, out pInfo) ? pInfo.Code : "PRJ";
            var assigneeName = task.AssigneeId.HasValue && userDict.TryGetValue(task.AssigneeId.Value, out var aName) ? aName : null;
            var commentCount = commentCounts.TryGetValue(task.Id, out var count) ? count : 0;
            var isOverdue = task.DueDate.HasValue && task.DueDate.Value.Date < today && task.Status != ProjectTaskStatus.Done;

            result.Add(new MyTaskResponseDto(
                task.Id,
                task.ProjectId,
                projName,
                projCode,
                task.TaskCode,
                task.Title,
                task.Description,
                task.Status,
                task.Priority,
                task.DueDate,
                task.EstimatedHours,
                task.ActualHours,
                task.AssigneeId,
                assigneeName,
                task.CreatedAt,
                commentCount,
                isOverdue
            ));
        }

        return result
            .OrderByDescending(t => t.IsOverdue)
            .ThenBy(t => t.Status == ProjectTaskStatus.Done)
            .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(t => t.Priority)
            .ToList();
    }

    public async Task<TaskResponseDto?> GetTaskByIdAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken);
        if (task == null) return null;

        var subTasksEntities = await _taskRepository.FindAsync(t => t.ParentTaskId == taskId, cancellationToken);
        var subTasks = subTasksEntities.Select(s => new SubTaskSummaryDto(s.Id, s.TaskCode, s.Title, s.Status)).ToList();

        var commentsEntities = await _commentRepository.FindAsync(c => c.TaskId == taskId, cancellationToken);
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var userDict = users.ToDictionary(u => u.Id, u => u.FullName);

        var comments = commentsEntities.OrderBy(c => c.CreatedAt).Select(c => new TaskCommentDto(
            c.Id,
            c.UserId,
            userDict.TryGetValue(c.UserId, out var author) ? author : "Unknown",
            c.Content,
            c.CreatedAt
        )).ToList();

        var assigneeName = task.AssigneeId.HasValue && userDict.TryGetValue(task.AssigneeId.Value, out var name) ? name : null;

        return new TaskResponseDto(
            task.Id,
            task.ProjectId,
            task.TaskCode,
            task.Title,
            task.Description,
            task.Status,
            task.Priority,
            task.DueDate,
            task.EstimatedHours,
            task.ActualHours,
            task.AssigneeId,
            assigneeName,
            task.ParentTaskId,
            task.CreatedAt,
            subTasks,
            comments
        );
    }

    public async Task<TaskResponseDto> CreateTaskAsync(Guid creatorUserId, CreateTaskRequestDto request, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null) throw new KeyNotFoundException("Dự án không tồn tại.");

        var existingTasks = await _taskRepository.FindAsync(t => t.ProjectId == request.ProjectId, cancellationToken);
        var nextNumber = existingTasks.Count + 1;
        var taskCode = $"{project.Code}-{nextNumber}";

        var newTask = new ProjectTask
        {
            ProjectId = request.ProjectId,
            TaskCode = taskCode,
            Title = request.Title.Trim(),
            Description = request.Description,
            Priority = request.Priority,
            Status = ProjectTaskStatus.Todo,
            DueDate = request.DueDate,
            EstimatedHours = request.EstimatedHours,
            AssigneeId = request.AssigneeId,
            ParentTaskId = request.ParentTaskId,
            CreatedBy = creatorUserId.ToString()
        };

        await _taskRepository.AddAsync(newTask, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await GetTaskByIdAsync(newTask.Id, cancellationToken))!;
    }

    public async Task<TaskResponseDto> UpdateTaskAsync(Guid taskId, UpdateTaskRequestDto request, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken);
        if (task == null) throw new KeyNotFoundException("Không tìm thấy công việc.");

        task.Title = request.Title.Trim();
        task.Description = request.Description;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.DueDate = request.DueDate;
        task.EstimatedHours = request.EstimatedHours;
        task.ActualHours = request.ActualHours;
        task.AssigneeId = request.AssigneeId;

        await _taskRepository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await GetTaskByIdAsync(taskId, cancellationToken))!;
    }

    public async Task<TaskResponseDto> AssignTaskAsync(Guid taskId, Guid? assigneeId, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken);
        if (task == null) throw new KeyNotFoundException("Không tìm thấy công việc.");

        if (assigneeId.HasValue)
        {
            var user = await _userRepository.GetByIdAsync(assigneeId.Value, cancellationToken);
            if (user == null) throw new KeyNotFoundException("Người dùng được chỉ định không tồn tại.");
        }

        task.AssigneeId = assigneeId;
        await _taskRepository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await GetTaskByIdAsync(taskId, cancellationToken))!;
    }

    public async Task DeleteTaskAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken);
        if (task != null)
        {
            await _taskRepository.DeleteAsync(task, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<TaskCommentDto> AddCommentAsync(Guid taskId, Guid userId, string content, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null) throw new KeyNotFoundException("Người dùng không tồn tại.");

        var comment = new TaskComment
        {
            TaskId = taskId,
            UserId = userId,
            Content = content.Trim()
        };

        await _commentRepository.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TaskCommentDto(comment.Id, user.Id, user.FullName, comment.Content, comment.CreatedAt);
    }
}
