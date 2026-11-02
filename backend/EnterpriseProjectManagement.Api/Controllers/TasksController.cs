using System.Security.Claims;
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

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
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
            return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var task = await _taskService.UpdateTaskAsync(id, request, cancellationToken);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> AssignTask(Guid id, [FromBody] AssignTaskRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var task = await _taskService.AssignTaskAsync(id, request.AssigneeId, cancellationToken);
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
        await _taskService.DeleteTaskAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CreateCommentRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _taskService.AddCommentAsync(id, userId, request.Content, cancellationToken);
            return Ok(comment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
