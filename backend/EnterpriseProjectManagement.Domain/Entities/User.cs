using EnterpriseProjectManagement.Domain.Common;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public SystemRole SystemRole { get; set; } = SystemRole.User;

    public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    public ICollection<ProjectTask> AssignedTasks { get; set; } = new List<ProjectTask>();
}
