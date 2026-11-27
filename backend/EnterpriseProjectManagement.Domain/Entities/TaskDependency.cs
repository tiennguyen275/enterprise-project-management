using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Domain.Entities;

public class TaskDependency : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid PredecessorTaskId { get; set; }
    public ProjectTask PredecessorTask { get; set; } = null!;

    public Guid SuccessorTaskId { get; set; }
    public ProjectTask SuccessorTask { get; set; } = null!;

    public int LagDays { get; set; }
}

