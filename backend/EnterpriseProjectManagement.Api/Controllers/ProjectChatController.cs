using System.Security.Claims;
using EnterpriseProjectManagement.Application.Features.ProjectChat.DTOs;
using EnterpriseProjectManagement.Application.Features.ProjectChat.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:guid}/messages")]
public class ProjectChatController : ControllerBase
{
    private readonly IProjectChatService _chatService;

    public ProjectChatController(IProjectChatService chatService)
    {
        _chatService = chatService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages([FromRoute] Guid projectId, [FromQuery] int limit = 50, CancellationToken cancellationToken = default)
    {
        var messages = await _chatService.GetMessagesAsync(projectId, limit, cancellationToken);
        return Ok(messages);
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromRoute] Guid projectId, [FromBody] SendProjectMessageRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var senderId = GetCurrentUserId();
            var message = await _chatService.SendMessageAsync(projectId, senderId, request, cancellationToken);
            return Ok(message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

