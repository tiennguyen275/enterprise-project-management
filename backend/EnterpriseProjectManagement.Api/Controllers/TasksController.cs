using System.Security.Claims;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Tasks.DTOs;
using EnterpriseProjectManagement.Application.Features.Tasks.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly IRealtimeNotificationService _realtimeNotificationService;

    public TasksController(ITaskService taskService, IRealtimeNotificationService realtimeNotificationService)
    {
        _taskService = taskService;
        _realtimeNotificationService = realtimeNotificationService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    private async Task BroadcastTaskEventAsync(TaskResponseDto task, string action, CancellationToken cancellationToken)
    {
        if (task.ParentTaskId.HasValue)
        {
            var parent = await _taskService.GetTaskByIdAsync(task.ParentTaskId.Value, cancellationToken);
            if (parent != null)
            {
                await _realtimeNotificationService.NotifyTaskUpdatedAsync(parent.ProjectId, parent, "updated", cancellationToken);
                return;
            }
        }
        await _realtimeNotificationService.NotifyTaskUpdatedAsync(task.ProjectId, task, action, cancellationToken);
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetTasksByProject(Guid projectId, CancellationToken cancellationToken)
    {
        var tasks = await _taskService.GetTasksByProjectAsync(projectId, cancellationToken);
        return Ok(tasks);
    }

    [HttpGet("my-tasks")]
    public async Task<IActionResult> GetMyTasks(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var tasks = await _taskService.GetMyTasksAsync(userId, cancellationToken);
        return Ok(tasks);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTaskById(Guid id, CancellationToken cancellationToken)
    {
        var task = await _taskService.GetTaskByIdAsync(id, cancellationToken);
        if (task == null) return NotFound(new { message = "Không tìm thấy công việc." });
        return Ok(task);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var task = await _taskService.CreateTaskAsync(userId, request, cancellationToken);
            await BroadcastTaskEventAsync(task, "created", cancellationToken);
            return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var task = await _taskService.UpdateTaskAsync(id, request, cancellationToken);
            await BroadcastTaskEventAsync(task, "updated", cancellationToken);
            return Ok(task);
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

    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> AssignTask(Guid id, [FromBody] AssignTaskRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var task = await _taskService.AssignTaskAsync(id, request.AssigneeId, cancellationToken);
            await BroadcastTaskEventAsync(task, "assigned", cancellationToken);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id, CancellationToken cancellationToken)
    {
        var existing = await _taskService.GetTaskByIdAsync(id, cancellationToken);
        await _taskService.DeleteTaskAsync(id, cancellationToken);
        if (existing != null)
        {
            await BroadcastTaskEventAsync(existing, "deleted", cancellationToken);
        }
        return NoContent();
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CreateCommentRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _taskService.AddCommentAsync(id, userId, request.Content, cancellationToken);
            var existing = await _taskService.GetTaskByIdAsync(id, cancellationToken);
            if (existing != null)
            {
                await _realtimeNotificationService.NotifyProjectDataChangedAsync(existing.ProjectId, "comment_added", cancellationToken);
            }
            return Ok(comment);
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
}
