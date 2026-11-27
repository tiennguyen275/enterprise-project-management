using System.Security.Claims;
using EnterpriseProjectManagement.Application.Common.Exceptions;
using EnterpriseProjectManagement.Application.Features.AiAssistant.DTOs;
using EnterpriseProjectManagement.Application.Features.AiAssistant.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiAssistantController : ControllerBase
{
    private readonly IAiAssistantService _aiAssistantService;

    public AiAssistantController(IAiAssistantService aiAssistantService)
    {
        _aiAssistantService = aiAssistantService;
    }

    [HttpPost("projects/{projectId:guid}/insight")]
    public async Task<IActionResult> GetProjectInsight(Guid projectId, CancellationToken cancellationToken)
    {
        try
        {
            var insight = await _aiAssistantService.GetProjectInsightAsync(projectId, cancellationToken);
            return Ok(insight);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (AiUnavailableException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
        }
    }

    [HttpPost("tasks/{taskId:guid}/subtask-suggestions")]
    public async Task<IActionResult> SuggestSubtasks(Guid taskId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _aiAssistantService.SuggestSubtasksAsync(taskId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (AiUnavailableException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
        }
    }

    [HttpGet("tasks/{taskId:guid}/assignee-suggestions")]
    public async Task<IActionResult> SuggestAssignees(Guid taskId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _aiAssistantService.SuggestAssigneesAsync(taskId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("tasks/{taskId:guid}/description-suggestion")]
    public async Task<IActionResult> SuggestTaskDescription(
        Guid taskId,
        [FromBody] TaskDescriptionSuggestionRequestDto? request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });
        }

        try
        {
            var result = await _aiAssistantService.SuggestTaskDescriptionAsync(
                taskId,
                userId,
                request?.CurrentDescription,
                cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
