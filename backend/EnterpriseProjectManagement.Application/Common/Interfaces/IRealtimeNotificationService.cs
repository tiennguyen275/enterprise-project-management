namespace EnterpriseProjectManagement.Application.Common.Interfaces;

public interface IRealtimeNotificationService
{
    Task NotifyProjectMessageReceivedAsync(Guid projectId, object message, CancellationToken cancellationToken = default);
    Task NotifyTaskUpdatedAsync(Guid projectId, object task, string action, CancellationToken cancellationToken = default);
    Task NotifyProjectDataChangedAsync(Guid projectId, string reason, CancellationToken cancellationToken = default);
}

