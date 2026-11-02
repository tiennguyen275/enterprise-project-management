using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Domain.Entities;

public class TaskComment : BaseEntity
{
    public Guid TaskId { get; set; }
    public ProjectTask Task { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
}
