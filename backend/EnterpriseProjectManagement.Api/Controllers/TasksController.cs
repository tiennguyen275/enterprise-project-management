using System.Security.Claims;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Activities.Services;
using EnterpriseProjectManagement.Application.Features.Notifications.Services;
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
    private readonly ITaskAttachmentService _attachmentService;
    private readonly IRealtimeNotificationService _realtimeNotificationService;
    private readonly INotificationService _notificationService;
    private readonly IActivityLogService _activityLogService;

    public TasksController(
        ITaskService taskService,
        ITaskAttachmentService attachmentService,
        IRealtimeNotificationService realtimeNotificationService,
        INotificationService notificationService,
        IActivityLogService activityLogService)
    {
        _taskService = taskService;
        _attachmentService = attachmentService;
        _realtimeNotificationService = realtimeNotificationService;
        _notificationService = notificationService;
        _activityLogService = activityLogService;
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
            await _activityLogService.LogAsync(
                task.ProjectId,
                userId,
                "task_created",
                task.TaskCode,
                $"Tạo công việc \"{task.Title}\"",
                cancellationToken);
            if (task.AssigneeId.HasValue && task.AssigneeId.Value != userId)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssigneeId.Value,
                    "Bạn được giao công việc mới",
                    $"[{task.TaskCode}] {task.Title}",
                    "task_assigned",
                    $"/projects/{task.ProjectId}?taskId={task.Id}",
                    userId,
                    cancellationToken);
            }
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
            var userId = GetCurrentUserId();
            var previous = await _taskService.GetTaskByIdAsync(id, cancellationToken);
            var task = await _taskService.UpdateTaskAsync(id, request, cancellationToken);
            await BroadcastTaskEventAsync(task, "updated", cancellationToken);
            await _activityLogService.LogAsync(
                task.ProjectId,
                userId,
                "task_updated",
                task.TaskCode,
                $"Cập nhật công việc \"{task.Title}\" (Trạng thái: {task.Status})",
                cancellationToken);
            if (task.AssigneeId.HasValue && task.AssigneeId.Value != userId && previous?.AssigneeId != task.AssigneeId)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssigneeId.Value,
                    "Bạn được phân công công việc",
                    $"[{task.TaskCode}] {task.Title}",
                    "task_assigned",
                    $"/projects/{task.ProjectId}?taskId={task.Id}",
                    userId,
                    cancellationToken);
            }
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
                await _activityLogService.LogAsync(
                    existing.ProjectId,
                    userId,
                    "comment_added",
                    existing.TaskCode,
                    $"Bình luận trên \"{existing.Title}\"",
                    cancellationToken);
                if (existing.AssigneeId.HasValue && existing.AssigneeId.Value != userId)
                {
                    await _notificationService.CreateNotificationAsync(
                        existing.AssigneeId.Value,
                        "Bình luận mới trên công việc của bạn",
                        $"[{existing.TaskCode}] {request.Content}",
                        "comment_added",
                        $"/projects/{existing.ProjectId}?taskId={existing.Id}",
                        userId,
                        cancellationToken);
                }
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

    private static string GetAttachmentsRootPath()
    {
        var dir = Path.Combine(AppContext.BaseDirectory, "uploads", "attachments");
        Directory.CreateDirectory(dir);
        return dir;
    }

    [HttpGet("{id:guid}/attachments")]
    public async Task<IActionResult> GetAttachments(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var items = await _attachmentService.GetAttachmentsAsync(id, userId, cancellationToken);
            return Ok(items);
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

    [HttpPost("{id:guid}/attachments")]
    [RequestSizeLimit(TaskAttachmentService.MaxFileSizeBytes + 1024 * 1024)]
    public async Task<IActionResult> UploadAttachment(Guid id, [FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn tệp đính kèm hợp lệ." });
        }

        if (file.Length > TaskAttachmentService.MaxFileSizeBytes)
        {
            return BadRequest(new { message = "Tệp đính kèm không được vượt quá 10 MB." });
        }

        var ext = Path.GetExtension(file.FileName);
        if (!TaskAttachmentService.IsExtensionAllowed(ext))
        {
            return BadRequest(new { message = "Định dạng tệp không được hỗ trợ. Hỗ trợ: PDF, ảnh, Word, Excel, PowerPoint, TXT, CSV, ZIP." });
        }

        try
        {
            var userId = GetCurrentUserId();
            var projectId = await _attachmentService.ValidateTaskAccessAsync(id, userId, cancellationToken);
            var storedName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var fullPath = Path.Combine(GetAttachmentsRootPath(), storedName);

            TaskAttachmentDto saved;
            try
            {
                await using (var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(stream, cancellationToken);
                }

                saved = await _attachmentService.SaveAttachmentRecordAsync(
                    id,
                    userId,
                    file.FileName,
                    storedName,
                    file.Length,
                    cancellationToken);
            }
            catch
            {
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
                throw;
            }

            var task = await _taskService.GetTaskByIdAsync(id, cancellationToken);
            await _activityLogService.LogAsync(
                projectId,
                userId,
                "attachment_uploaded",
                task?.TaskCode,
                $"Đính kèm tệp \"{saved.FileName}\"",
                cancellationToken);

            return Ok(saved);
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

    [HttpGet("{id:guid}/attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAttachment(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var fileMeta = await _attachmentService.GetAttachmentFileAsync(id, attachmentId, userId, cancellationToken);
            if (fileMeta == null) return NotFound(new { message = "Không tìm thấy tệp đính kèm." });

            var fullPath = Path.Combine(GetAttachmentsRootPath(), Path.GetFileName(fileMeta.StoredFileName));
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Tệp không còn tồn tại trên máy chủ." });
            }

            Response.Headers["X-Content-Type-Options"] = "nosniff";
            return PhysicalFile(fullPath, fileMeta.ContentType, fileMeta.FileName);
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

    [HttpDelete("{id:guid}/attachments/{attachmentId:guid}")]
    public async Task<IActionResult> DeleteAttachment(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var storedName = await _attachmentService.DeleteAttachmentAsync(id, attachmentId, userId, cancellationToken);
            if (storedName == null) return NotFound(new { message = "Không tìm thấy tệp đính kèm." });

            var fullPath = Path.Combine(GetAttachmentsRootPath(), Path.GetFileName(storedName));
            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }

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
    }
}
