using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Schedule.DTOs;
using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Features.Schedule.Services;

public class ScheduleService : IScheduleService
{
    private readonly IRepository<TaskDependency> _dependencyRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ScheduleService(
        IRepository<TaskDependency> dependencyRepository,
        IRepository<ProjectTask> taskRepository,
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork)
    {
        _dependencyRepository = dependencyRepository;
        _taskRepository = taskRepository;
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TaskDependencyDto>> GetDependenciesAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var dependencies = await _dependencyRepository.FindAsync(d => d.ProjectId == projectId, cancellationToken);
        if (dependencies.Count == 0)
        {
            return Array.Empty<TaskDependencyDto>();
        }

        var taskIds = dependencies.Select(d => d.PredecessorTaskId)
            .Concat(dependencies.Select(d => d.SuccessorTaskId))
            .Distinct()
            .ToList();

        var tasks = await _taskRepository.FindAsync(t => taskIds.Contains(t.Id), cancellationToken);
        var taskMap = tasks.ToDictionary(t => t.Id);

        return dependencies
            .Where(d => taskMap.ContainsKey(d.PredecessorTaskId) && taskMap.ContainsKey(d.SuccessorTaskId))
            .Select(d => new TaskDependencyDto(
                d.Id,
                d.ProjectId,
                d.PredecessorTaskId,
                taskMap[d.PredecessorTaskId].TaskCode,
                taskMap[d.PredecessorTaskId].Title,
                d.SuccessorTaskId,
                taskMap[d.SuccessorTaskId].TaskCode,
                taskMap[d.SuccessorTaskId].Title,
                d.LagDays))
            .ToList();
    }

    public async Task<TaskDependencyDto> AddDependencyAsync(Guid projectId, CreateTaskDependencyRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request.PredecessorTaskId == request.SuccessorTaskId)
        {
            throw new InvalidOperationException("Một công việc không thể phụ thuộc vào chính nó.");
        }

        var predecessor = await _taskRepository.GetByIdAsync(request.PredecessorTaskId, cancellationToken);
        var successor = await _taskRepository.GetByIdAsync(request.SuccessorTaskId, cancellationToken);

        if (predecessor == null || successor == null || predecessor.ProjectId != projectId || successor.ProjectId != projectId)
        {
            throw new KeyNotFoundException("Không tìm thấy một trong hai công việc thuộc dự án này.");
        }

        if (predecessor.ParentTaskId.HasValue || successor.ParentTaskId.HasValue)
        {
            throw new InvalidOperationException("Ràng buộc phụ thuộc chỉ áp dụng giữa các công việc chính (không áp dụng cho công việc con).");
        }

        var allDeps = await _dependencyRepository.FindAsync(d => d.ProjectId == projectId, cancellationToken);
        if (allDeps.Any(d => d.PredecessorTaskId == request.PredecessorTaskId && d.SuccessorTaskId == request.SuccessorTaskId))
        {
            throw new InvalidOperationException("Ràng buộc phụ thuộc giữa hai công việc này đã tồn tại.");
        }

        var graph = new Dictionary<Guid, List<Guid>>();
        foreach (var dep in allDeps)
        {
            if (!graph.ContainsKey(dep.PredecessorTaskId))
            {
                graph[dep.PredecessorTaskId] = new List<Guid>();
            }
            graph[dep.PredecessorTaskId].Add(dep.SuccessorTaskId);
        }

        if (!graph.ContainsKey(request.PredecessorTaskId))
        {
            graph[request.PredecessorTaskId] = new List<Guid>();
        }
        graph[request.PredecessorTaskId].Add(request.SuccessorTaskId);

        if (HasPath(graph, request.SuccessorTaskId, request.PredecessorTaskId))
        {
            throw new InvalidOperationException("Không thể thiết lập ràng buộc vì sẽ tạo ra chu trình lặp vô tận (Cycle Dependency).");
        }

        var dependency = new TaskDependency
        {
            ProjectId = projectId,
            PredecessorTaskId = request.PredecessorTaskId,
            SuccessorTaskId = request.SuccessorTaskId,
            LagDays = Math.Max(0, request.LagDays)
        };

        await _dependencyRepository.AddAsync(dependency, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TaskDependencyDto(
            dependency.Id,
            dependency.ProjectId,
            predecessor.Id,
            predecessor.TaskCode,
            predecessor.Title,
            successor.Id,
            successor.TaskCode,
            successor.Title,
            dependency.LagDays);
    }

    public async Task RemoveDependencyAsync(Guid projectId, Guid dependencyId, CancellationToken cancellationToken = default)
    {
        var dependency = await _dependencyRepository.GetByIdAsync(dependencyId, cancellationToken);
        if (dependency != null && dependency.ProjectId == projectId)
        {
            await _dependencyRepository.DeleteAsync(dependency, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<ProjectCpmScheduleResponseDto> GetProjectScheduleAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new KeyNotFoundException("Không tìm thấy dự án.");
        }

        var baseDate = (project.StartDate ?? project.CreatedAt).Date;
        var allTasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId && t.ParentTaskId == null, cancellationToken);
        var dependencies = await _dependencyRepository.FindAsync(d => d.ProjectId == projectId, cancellationToken);

        var taskMap = allTasks.ToDictionary(t => t.Id);

        var assigneeIds = allTasks.Where(t => t.AssigneeId.HasValue).Select(t => t.AssigneeId!.Value).Distinct().ToList();
        var users = assigneeIds.Count > 0
            ? await _userRepository.FindAsync(u => assigneeIds.Contains(u.Id), cancellationToken)
            : Array.Empty<User>();
        var userMap = users.ToDictionary(u => u.Id, u => u.FullName);

        var dependencyDtos = dependencies
            .Where(d => taskMap.ContainsKey(d.PredecessorTaskId) && taskMap.ContainsKey(d.SuccessorTaskId))
            .Select(d =>
            {
                var pred = taskMap[d.PredecessorTaskId];
                var succ = taskMap[d.SuccessorTaskId];
                return new TaskDependencyDto(
                    d.Id,
                    d.ProjectId,
                    d.PredecessorTaskId,
                    pred.TaskCode,
                    pred.Title,
                    d.SuccessorTaskId,
                    succ.TaskCode,
                    succ.Title,
                    d.LagDays);
            })
            .ToList();

        if (allTasks.Count == 0)
        {
            return new ProjectCpmScheduleResponseDto(
                project.Id,
                project.Code,
                project.Name,
                baseDate,
                0,
                baseDate,
                0,
                Array.Empty<CpmTaskScheduleDto>(),
                dependencyDtos);
        }

        var durationMap = allTasks.ToDictionary(
            t => t.Id,
            t =>
            {
                if (t.EstimatedHours.HasValue && t.EstimatedHours.Value > 0)
                {
                    return Math.Max(1, (int)Math.Ceiling(t.EstimatedHours.Value / 8m));
                }
                if (t.DueDate.HasValue && t.DueDate.Value.Date >= baseDate)
                {
                    var days = (t.DueDate.Value.Date - baseDate).Days + 1;
                    return Math.Max(1, Math.Min(days, 14));
                }
                return 1;
            });

        var predecessorMap = allTasks.ToDictionary(
            t => t.Id,
            t => dependencies.Where(d => d.SuccessorTaskId == t.Id && taskMap.ContainsKey(d.PredecessorTaskId)).ToList());

        var successorMap = allTasks.ToDictionary(
            t => t.Id,
            t => dependencies.Where(d => d.PredecessorTaskId == t.Id && taskMap.ContainsKey(d.SuccessorTaskId)).ToList());

        var inDegree = allTasks.ToDictionary(t => t.Id, t => predecessorMap[t.Id].Count);
        var queue = new Queue<Guid>(inDegree.Where(kvp => kvp.Value == 0).Select(kvp => kvp.Key));
        var topoOrder = new List<Guid>();

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            topoOrder.Add(current);

            foreach (var edge in successorMap[current])
            {
                inDegree[edge.SuccessorTaskId]--;
                if (inDegree[edge.SuccessorTaskId] == 0)
                {
                    queue.Enqueue(edge.SuccessorTaskId);
                }
            }
        }

        if (topoOrder.Count < allTasks.Count)
        {
            var remaining = allTasks.Select(t => t.Id).Except(topoOrder);
            topoOrder.AddRange(remaining);
        }

        var earlyStart = new Dictionary<Guid, int>();
        var earlyFinish = new Dictionary<Guid, int>();

        foreach (var taskId in topoOrder)
        {
            var preds = predecessorMap[taskId];
            var es = 0;
            if (preds.Count > 0)
            {
                es = preds.Max(p => earlyFinish[p.PredecessorTaskId] + Math.Max(0, p.LagDays));
            }
            earlyStart[taskId] = es;
            earlyFinish[taskId] = es + durationMap[taskId];
        }

        var totalProjectDays = earlyFinish.Values.Count > 0 ? earlyFinish.Values.Max() : 0;

        var lateStart = new Dictionary<Guid, int>();
        var lateFinish = new Dictionary<Guid, int>();

        for (var i = topoOrder.Count - 1; i >= 0; i--)
        {
            var taskId = topoOrder[i];
            var succs = successorMap[taskId];
            var lf = totalProjectDays;
            if (succs.Count > 0)
            {
                lf = succs.Min(s => lateStart[s.SuccessorTaskId] - Math.Max(0, s.LagDays));
            }
            lateFinish[taskId] = lf;
            lateStart[taskId] = lf - durationMap[taskId];
        }

        var scheduleItems = new List<CpmTaskScheduleDto>();

        foreach (var task in allTasks.OrderBy(t => earlyStart[t.Id]).ThenBy(t => t.TaskCode))
        {
            var es = earlyStart[task.Id];
            var ef = earlyFinish[task.Id];
            var ls = lateStart[task.Id];
            var lf = lateFinish[task.Id];
            var totalFloat = ls - es;
            var isCritical = totalFloat <= 0;

            var calcStart = baseDate.AddDays(es);
            var calcEnd = baseDate.AddDays(Math.Max(0, ef - 1));

            var predIds = predecessorMap[task.Id].Select(p => p.PredecessorTaskId).ToList();
            var assigneeName = task.AssigneeId.HasValue && userMap.ContainsKey(task.AssigneeId.Value)
                ? userMap[task.AssigneeId.Value]
                : null;

            scheduleItems.Add(new CpmTaskScheduleDto(
                task.Id,
                task.TaskCode,
                task.Title,
                (int)task.Status,
                (int)task.Priority,
                task.EstimatedHours,
                task.ActualHours,
                task.DueDate,
                assigneeName,
                durationMap[task.Id],
                es,
                ef,
                ls,
                lf,
                totalFloat,
                isCritical,
                calcStart,
                calcEnd,
                predIds));
        }

        var projectedEndDate = baseDate.AddDays(Math.Max(0, totalProjectDays - 1));
        var criticalTasksCount = scheduleItems.Count(s => s.IsCritical);

        return new ProjectCpmScheduleResponseDto(
            project.Id,
            project.Code,
            project.Name,
            baseDate,
            totalProjectDays,
            projectedEndDate,
            criticalTasksCount,
            scheduleItems,
            dependencyDtos);
    }

    private static bool HasPath(Dictionary<Guid, List<Guid>> graph, Guid start, Guid target)
    {
        var visited = new HashSet<Guid>();
        var stack = new Stack<Guid>();
        stack.Push(start);

        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (current == target)
            {
                return true;
            }

            if (visited.Add(current) && graph.TryGetValue(current, out var neighbors))
            {
                foreach (var next in neighbors)
                {
                    if (!visited.Contains(next))
                    {
                        stack.Push(next);
                    }
                }
            }
        }

        return false;
    }
}
