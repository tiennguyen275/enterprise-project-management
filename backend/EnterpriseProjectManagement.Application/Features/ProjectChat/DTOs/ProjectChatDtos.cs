namespace EnterpriseProjectManagement.Application.Features.ProjectChat.DTOs;

public record ProjectChatMessageDto(
    Guid Id,
    Guid ProjectId,
    Guid? SenderId,
    string SenderName,
    string Content,
    bool IsAiGenerated,
    DateTime CreatedAt
);

public record SendProjectMessageRequestDto(
    string Content,
    bool AskAi = false
);

