using EnterpriseProjectManagement.Api.Hubs;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EnterpriseProjectManagement.Api.Services;

public class SignalRRealtimeNotificationService : IRealtimeNotificationService
{
    private readonly IHubContext<ProjectHub> _hubContext;

    public SignalRRealtimeNotificationService(IHubContext<ProjectHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyProjectMessageReceivedAsync(Guid projectId, object message, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.Group(projectId.ToString()).SendAsync("ReceiveProjectMessage", message, cancellationToken);
    }

    public async Task NotifyTaskUpdatedAsync(Guid projectId, object task, string action, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.Group(projectId.ToString()).SendAsync("ReceiveTaskUpdate", new { Task = task, Action = action }, cancellationToken);
    }

    public async Task NotifyProjectDataChangedAsync(Guid projectId, string reason, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.Group(projectId.ToString()).SendAsync("ReceiveProjectDataChanged", new { Reason = reason }, cancellationToken);
    }
}

