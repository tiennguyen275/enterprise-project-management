using EnterpriseProjectManagement.Application.Features.ProjectChat.DTOs;

namespace EnterpriseProjectManagement.Application.Features.ProjectChat.Services;

public interface IProjectChatService
{
    Task<IReadOnlyList<ProjectChatMessageDto>> GetMessagesAsync(Guid projectId, int limit = 50, CancellationToken cancellationToken = default);
    Task<ProjectChatMessageDto> SendMessageAsync(Guid projectId, Guid senderId, SendProjectMessageRequestDto request, CancellationToken cancellationToken = default);
}

