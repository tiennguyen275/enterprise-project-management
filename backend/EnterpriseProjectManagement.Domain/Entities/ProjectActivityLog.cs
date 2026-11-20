using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Domain.Entities;

public class ProjectActivityLog : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid? ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string? ActorAvatarUrl { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? TargetCode { get; set; }
    public string Description { get; set; } = string.Empty;
}
