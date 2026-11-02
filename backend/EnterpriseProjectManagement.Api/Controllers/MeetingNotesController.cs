using System.Security.Claims;
using EnterpriseProjectManagement.Application.Features.MeetingNotes.DTOs;
using EnterpriseProjectManagement.Application.Features.MeetingNotes.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MeetingNotesController : ControllerBase
{
    private readonly IMeetingNoteService _meetingNoteService;

    public MeetingNotesController(IMeetingNoteService meetingNoteService)
    {
        _meetingNoteService = meetingNoteService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetNotesByProject(Guid projectId, CancellationToken cancellationToken)
    {
        var notes = await _meetingNoteService.GetNotesByProjectAsync(projectId, cancellationToken);
        return Ok(notes);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetNoteById(Guid id, CancellationToken cancellationToken)
    {
        var note = await _meetingNoteService.GetNoteByIdAsync(id, cancellationToken);
        if (note == null) return NotFound(new { message = "Không tìm thấy biên bản cuộc họp." });
        return Ok(note);
    }

    [HttpPost]
    public async Task<IActionResult> CreateNote([FromBody] CreateMeetingNoteRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var note = await _meetingNoteService.CreateNoteAsync(userId, request, cancellationToken);
            return CreatedAtAction(nameof(GetNoteById), new { id = note.Id }, note);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNote(Guid id, CancellationToken cancellationToken)
    {
        await _meetingNoteService.DeleteNoteAsync(id, cancellationToken);
        return NoContent();
    }
}
