using EnterpriseProjectManagement.Application.Common.Exceptions;
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
}
