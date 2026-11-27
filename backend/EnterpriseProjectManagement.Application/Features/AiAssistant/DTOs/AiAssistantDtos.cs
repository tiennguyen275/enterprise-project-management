namespace EnterpriseProjectManagement.Application.Features.AiAssistant.DTOs;

public record ProjectInsightResponseDto(
    string Insight,
    DateTime GeneratedAt
);

public record SubtaskSuggestionResponseDto(
    IReadOnlyList<string> Suggestions
);

public record AssigneeSuggestionDto(
    Guid UserId,
    string FullName,
    int OpenTasks,
    decimal OpenEstimatedHours,
    bool IsRecommended
);
