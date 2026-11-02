namespace EnterpriseProjectManagement.Application.Features.MeetingNotes.DTOs;

public record CreateMeetingNoteRequestDto(
    Guid ProjectId,
    string Title,
    DateTime MeetingDate,
    string? Attendees,
    string Content,
    string? ActionItems
);

public record MeetingNoteResponseDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    DateTime MeetingDate,
    string? Attendees,
    string Content,
    string? ActionItems,
    DateTime CreatedAt,
    string? CreatedBy
);
