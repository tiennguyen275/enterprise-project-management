using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Domain.Entities;

public class UserNotification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; }
    public string? ActorName { get; set; }
    public string? ActorAvatarUrl { get; set; }
}
