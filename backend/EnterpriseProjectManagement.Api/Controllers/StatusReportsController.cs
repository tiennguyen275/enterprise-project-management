using System.Security.Claims;
using EnterpriseProjectManagement.Application.Features.StatusReports.DTOs;
using EnterpriseProjectManagement.Application.Features.StatusReports.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[ApiController]
[Route("api/status-reports")]
[Authorize]
public class StatusReportsController : ControllerBase
{
    private readonly IStatusReportService _statusReportService;

    public StatusReportsController(IStatusReportService statusReportService)
    {
        _statusReportService = statusReportService;
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.Parse(sub!);
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetProjectHealthAndReports(
        Guid projectId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var overview = await _statusReportService.GetProjectHealthAndReportsAsync(projectId, startDate, endDate, cancellationToken);
            return Ok(overview);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateStatusReport(
        [FromBody] CreateStatusReportRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var report = await _statusReportService.CreateStatusReportAsync(userId, request, cancellationToken);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStatusReport(Guid id, CancellationToken cancellationToken)
    {
        await _statusReportService.DeleteStatusReportAsync(id, cancellationToken);
        return NoContent();
    }
}

