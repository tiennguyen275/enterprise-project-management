using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.MeetingNotes.DTOs;
using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Features.MeetingNotes.Services;

public interface IMeetingNoteService
{
    Task<IReadOnlyList<MeetingNoteResponseDto>> GetNotesByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<MeetingNoteResponseDto?> GetNoteByIdAsync(Guid noteId, CancellationToken cancellationToken = default);
    Task<MeetingNoteResponseDto> CreateNoteAsync(Guid creatorUserId, CreateMeetingNoteRequestDto request, CancellationToken cancellationToken = default);
    Task DeleteNoteAsync(Guid noteId, CancellationToken cancellationToken = default);
}

public class MeetingNoteService : IMeetingNoteService
{
    private readonly IRepository<MeetingNote> _noteRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly IUnitOfWork _unitOfWork;

    public MeetingNoteService(
        IRepository<MeetingNote> noteRepository,
        IRepository<Project> projectRepository,
        IUnitOfWork unitOfWork)
    {
        _noteRepository = noteRepository;
        _projectRepository = projectRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<MeetingNoteResponseDto>> GetNotesByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var notes = await _noteRepository.FindAsync(n => n.ProjectId == projectId, cancellationToken);
        return notes.OrderByDescending(n => n.MeetingDate).Select(n => new MeetingNoteResponseDto(
            n.Id,
            n.ProjectId,
            n.Title,
            n.MeetingDate,
            n.Attendees,
            n.Content,
            n.ActionItems,
            n.CreatedAt,
            n.CreatedBy
        )).ToList();
    }

    public async Task<MeetingNoteResponseDto?> GetNoteByIdAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var n = await _noteRepository.GetByIdAsync(noteId, cancellationToken);
        if (n == null) return null;

        return new MeetingNoteResponseDto(
            n.Id,
            n.ProjectId,
            n.Title,
            n.MeetingDate,
            n.Attendees,
            n.Content,
            n.ActionItems,
            n.CreatedAt,
            n.CreatedBy
        );
    }

    public async Task<MeetingNoteResponseDto> CreateNoteAsync(Guid creatorUserId, CreateMeetingNoteRequestDto request, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null) throw new KeyNotFoundException("Dự án không tồn tại.");

        var note = new MeetingNote
        {
            ProjectId = request.ProjectId,
            Title = request.Title.Trim(),
            MeetingDate = request.MeetingDate,
            Attendees = request.Attendees?.Trim(),
            Content = request.Content.Trim(),
            ActionItems = request.ActionItems?.Trim(),
            CreatedBy = creatorUserId.ToString()
        };

        await _noteRepository.AddAsync(note, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await GetNoteByIdAsync(note.Id, cancellationToken))!;
    }

    public async Task DeleteNoteAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var note = await _noteRepository.GetByIdAsync(noteId, cancellationToken);
        if (note != null)
        {
            await _noteRepository.DeleteAsync(note, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
