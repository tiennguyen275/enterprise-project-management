using System.Security.Claims;
using EnterpriseProjectManagement.Application.Features.Activities.Services;
using EnterpriseProjectManagement.Application.Features.Notifications.Services;
using EnterpriseProjectManagement.Application.Features.Projects.DTOs;
using EnterpriseProjectManagement.Application.Features.Projects.Services;
using EnterpriseProjectManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IActivityLogService _activityLogService;
    private readonly INotificationService _notificationService;

    public ProjectsController(
        IProjectService projectService,
        IActivityLogService activityLogService,
        INotificationService notificationService)
    {
        _projectService = projectService;
        _activityLogService = activityLogService;
        _notificationService = notificationService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetMyProjects(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var projects = await _projectService.GetUserProjectsAsync(userId, cancellationToken);
        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProjectById(Guid id, CancellationToken cancellationToken)
    {
        var project = await _projectService.GetProjectByIdAsync(id, cancellationToken);
        if (project == null) return NotFound(new { message = "Không tìm thấy dự án." });
        return Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var project = await _projectService.CreateProjectAsync(userId, request, cancellationToken);
            await _activityLogService.LogAsync(
                project.Id,
                userId,
                "project_created",
                project.Code,
                $"Khởi tạo dự án \"{project.Name}\"",
                cancellationToken);
            return CreatedAtAction(nameof(GetProjectById), new { id = project.Id }, project);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var actorId = GetCurrentUserId();
            if (!await _projectService.CanUserManageProjectAsync(id, actorId, cancellationToken))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Chỉ Quản trị viên hoặc Quản lý dự án mới có quyền chỉnh sửa dự án." });
            }

            var project = await _projectService.UpdateProjectAsync(id, request, cancellationToken);
            await _activityLogService.LogAsync(
                id,
                actorId,
                "project_updated",
                project.Code,
                $"Cập nhật thông tin dự án \"{project.Name}\"",
                cancellationToken);
            return Ok(project);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id, CancellationToken cancellationToken)
    {
        var actorId = GetCurrentUserId();
        if (!await _projectService.CanUserManageProjectAsync(id, actorId, cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Chỉ Quản trị viên hoặc Quản lý dự án mới có quyền xóa dự án." });
        }

        await _projectService.DeleteProjectAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromQuery] string email, [FromQuery] ProjectRole role, CancellationToken cancellationToken)
    {
        try
        {
            var actorId = GetCurrentUserId();
            var addedMember = await _projectService.AddMemberAsync(id, email, role, cancellationToken);
            var project = await _projectService.GetProjectByIdAsync(id, cancellationToken);

            await _activityLogService.LogAsync(
                id,
                actorId,
                "member_added",
                project?.Code,
                $"Mời {addedMember.FullName} tham gia dự án ({role})",
                cancellationToken);

            if (addedMember.UserId != actorId && project != null)
            {
                await _notificationService.CreateNotificationAsync(
                    addedMember.UserId,
                    "Bạn được mời vào dự án mới",
                    $"Bạn đã được thêm vào dự án \"{project.Name}\" ({project.Code}).",
                    "member_added",
                    $"/projects/{project.Id}",
                    actorId,
                    cancellationToken);
            }

            return Ok(new { message = "Đã thêm thành viên vào dự án thành công." });
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

    [HttpDelete("{id:guid}/members/{memberUserId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberUserId, CancellationToken cancellationToken)
    {
        try
        {
            var actorId = GetCurrentUserId();
            await _projectService.RemoveMemberAsync(id, memberUserId, actorId, cancellationToken);
            var project = await _projectService.GetProjectByIdAsync(id, cancellationToken);
            await _activityLogService.LogAsync(
                id,
                actorId,
                "member_removed",
                project?.Code,
                "Đã gỡ một thành viên khỏi dự án",
                cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
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

    [HttpGet("{id:guid}/activities")]
    public async Task<IActionResult> GetProjectActivities(Guid id, [FromQuery] int limit = 40, CancellationToken cancellationToken = default)
    {
        try
        {
            var requesterId = GetCurrentUserId();
            var items = await _activityLogService.GetProjectActivitiesAsync(id, requesterId, limit, cancellationToken);
            return Ok(items);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/analytics")]
    public async Task<IActionResult> GetProjectAnalytics(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var analytics = await _projectService.GetProjectAnalyticsAsync(id, cancellationToken);
            return Ok(analytics);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
