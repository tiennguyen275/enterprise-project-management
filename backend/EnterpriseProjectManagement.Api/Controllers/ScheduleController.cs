using EnterpriseProjectManagement.Application.Features.Schedule.DTOs;
using EnterpriseProjectManagement.Application.Features.Schedule.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:guid}")]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public ScheduleController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet("schedule")]
    public async Task<IActionResult> GetProjectSchedule([FromRoute] Guid projectId, CancellationToken cancellationToken)
    {
        try
        {
            var schedule = await _scheduleService.GetProjectScheduleAsync(projectId, cancellationToken);
            return Ok(schedule);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("dependencies")]
    public async Task<IActionResult> GetDependencies([FromRoute] Guid projectId, CancellationToken cancellationToken)
    {
        var dependencies = await _scheduleService.GetDependenciesAsync(projectId, cancellationToken);
        return Ok(dependencies);
    }

    [HttpPost("dependencies")]
    public async Task<IActionResult> AddDependency([FromRoute] Guid projectId, [FromBody] CreateTaskDependencyRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var dependency = await _scheduleService.AddDependencyAsync(projectId, request, cancellationToken);
            return Ok(dependency);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("dependencies/{dependencyId:guid}")]
    public async Task<IActionResult> RemoveDependency([FromRoute] Guid projectId, [FromRoute] Guid dependencyId, CancellationToken cancellationToken)
    {
        await _scheduleService.RemoveDependencyAsync(projectId, dependencyId, cancellationToken);
        return NoContent();
    }
}
