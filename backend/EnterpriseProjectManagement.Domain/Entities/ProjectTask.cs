using EnterpriseProjectManagement.Domain.Common;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Domain.Entities;

public class ProjectTask : BaseEntity
{
    public string TaskCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateTime? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }

    public Guid? ParentTaskId { get; set; }
    public ProjectTask? ParentTask { get; set; }
    public ICollection<ProjectTask> SubTasks { get; set; } = new List<ProjectTask>();

    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
}
