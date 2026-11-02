using EnterpriseProjectManagement.Domain.Common;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Domain.Entities;

public class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public ProjectRole Role { get; set; } = ProjectRole.Member;
}
