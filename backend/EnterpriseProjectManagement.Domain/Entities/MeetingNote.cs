using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Domain.Entities;

public class MeetingNote : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; } = DateTime.UtcNow;
    public string? Attendees { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ActionItems { get; set; }
}
