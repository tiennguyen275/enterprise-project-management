using System.Security.Claims;
using EnterpriseProjectManagement.Application.Features.Projects.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EnterpriseProjectManagement.Api.Hubs;

[Authorize]
public class ProjectHub : Hub
{
    private readonly IProjectService _projectService;

    public ProjectHub(IProjectService projectService)
    {
        _projectService = projectService;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var parsed) ? parsed : null;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId.Value}");
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinProject(string projectId)
    {
        if (!Guid.TryParse(projectId, out var parsedProjectId))
        {
            throw new HubException("Mã dự án không hợp lệ.");
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue || !await _projectService.CanUserAccessProjectAsync(parsedProjectId, userId.Value))
        {
            throw new HubException("Bạn không có quyền truy cập kênh dự án này.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, parsedProjectId.ToString());
    }

    public async Task LeaveProject(string projectId)
    {
        if (!Guid.TryParse(projectId, out var parsedProjectId))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, parsedProjectId.ToString());
    }
}

