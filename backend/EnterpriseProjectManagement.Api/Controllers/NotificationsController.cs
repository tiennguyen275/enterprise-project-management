using System.Security.Claims;
using EnterpriseProjectManagement.Application.Features.Notifications.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 25, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var overview = await _notificationService.GetMyNotificationsAsync(userId, limit, cancellationToken);
        return Ok(overview);
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAsReadAsync(userId, id, cancellationToken);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);
        return NoContent();
    }
}
