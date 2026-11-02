using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Domain.Entities;

public class MeetingNote : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; } = DateTime.UtcNow;
    public string? Attendees { get; set; } // Danh sách người tham gia (phân cách bởi dấu phẩy)
    public string Content { get; set; } = string.Empty; // Nội dung cuộc họp
    public string? ActionItems { get; set; } // Các hạng mục cần hành động sau cuộc họp
}
