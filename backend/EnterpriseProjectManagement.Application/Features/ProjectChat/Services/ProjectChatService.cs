using System.Text;
using EnterpriseProjectManagement.Application.Common.Exceptions;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.ProjectChat.DTOs;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.ProjectChat.Services;

public class ProjectChatService : IProjectChatService
{
    private const string SystemInstruction = "Bạn là Trợ lý AI Gemini hỗ trợ quản lý dự án trong hệ thống EPMS. Hãy trả lời bằng tiếng Việt chuyên nghiệp, ngắn gọn, súc tích.";

    private readonly IRepository<ProjectChatMessage> _chatMessageRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealtimeNotificationService _realtimeNotificationService;
    private readonly IAiTextGenerator _aiTextGenerator;

    public ProjectChatService(
        IRepository<ProjectChatMessage> chatMessageRepository,
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        IRepository<ProjectTask> taskRepository,
        IUnitOfWork unitOfWork,
        IRealtimeNotificationService realtimeNotificationService,
        IAiTextGenerator aiTextGenerator)
    {
        _chatMessageRepository = chatMessageRepository;
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _taskRepository = taskRepository;
        _unitOfWork = unitOfWork;
        _realtimeNotificationService = realtimeNotificationService;
        _aiTextGenerator = aiTextGenerator;
    }

    public async Task<IReadOnlyList<ProjectChatMessageDto>> GetMessagesAsync(Guid projectId, int limit = 50, CancellationToken cancellationToken = default)
    {
        var messages = await _chatMessageRepository.FindAsync(m => m.ProjectId == projectId, cancellationToken);
        return messages
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ProjectChatMessageDto(
                m.Id,
                m.ProjectId,
                m.SenderId,
                m.SenderName,
                m.Content,
                m.IsAiGenerated,
                m.CreatedAt))
            .ToList();
    }

    public async Task<ProjectChatMessageDto> SendMessageAsync(Guid projectId, Guid senderId, SendProjectMessageRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ArgumentException("Nội dung tin nhắn không được để trống.", nameof(request));
        }

        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new KeyNotFoundException("Không tìm thấy dự án.");
        }

        var sender = await _userRepository.GetByIdAsync(senderId, cancellationToken);
        if (sender == null)
        {
            throw new KeyNotFoundException("Không tìm thấy thông tin người gửi.");
        }

        var trimmedContent = request.Content.Trim();

        var userMessage = new ProjectChatMessage
        {
            ProjectId = projectId,
            SenderId = senderId,
            SenderName = sender.FullName,
            Content = trimmedContent,
            IsAiGenerated = false
        };

        await _chatMessageRepository.AddAsync(userMessage, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userMessageDto = new ProjectChatMessageDto(
            userMessage.Id,
            userMessage.ProjectId,
            userMessage.SenderId,
            userMessage.SenderName,
            userMessage.Content,
            userMessage.IsAiGenerated,
            userMessage.CreatedAt);

        await _realtimeNotificationService.NotifyProjectMessageReceivedAsync(projectId, userMessageDto, cancellationToken);

        var isAiRequested = request.AskAi
            || trimmedContent.Contains("@ai", StringComparison.OrdinalIgnoreCase)
            || trimmedContent.StartsWith("/ai", StringComparison.OrdinalIgnoreCase);

        if (isAiRequested)
        {
            try
            {
                await ProcessAiResponseAsync(project, sender.FullName, trimmedContent, cancellationToken);
            }
            catch
            {
            }
        }

        return userMessageDto;
    }

    private async Task ProcessAiResponseAsync(Project project, string requesterName, string promptQuestion, CancellationToken cancellationToken)
    {
        var cleanedQuestion = promptQuestion
            .Replace("@ai", "", StringComparison.OrdinalIgnoreCase)
            .Replace("@AI", "", StringComparison.OrdinalIgnoreCase)
            .Trim();

        if (cleanedQuestion.StartsWith("/ai", StringComparison.OrdinalIgnoreCase))
        {
            cleanedQuestion = cleanedQuestion.Substring(3).Trim();
        }

        if (string.IsNullOrWhiteSpace(cleanedQuestion))
        {
            cleanedQuestion = "Đánh giá nhanh tình hình hiện tại của dự án và gợi ý hành động tiếp theo.";
        }

        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == project.Id && t.ParentTaskId == null, cancellationToken);
        var total = tasks.Count;
        var done = tasks.Count(t => t.Status == ProjectTaskStatus.Done);
        var inProgress = tasks.Count(t => t.Status == ProjectTaskStatus.InProgress);
        var today = DateTime.UtcNow.Date;
        var overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != ProjectTaskStatus.Done);

        var promptBuilder = new StringBuilder();
        promptBuilder.AppendLine($"Dự án: {project.Name} ({project.Code})");
        promptBuilder.AppendLine($"Trạng thái hiện tại: Tổng cộng {total} công việc, {done} đã hoàn thành, {inProgress} đang thực hiện, {overdue} quá hạn.");
        promptBuilder.AppendLine($"Thành viên {requesterName} vừa gửi câu hỏi vào phòng chat dự án: \"{cleanedQuestion}\"");
        promptBuilder.AppendLine("Yêu cầu phản hồi:");
        promptBuilder.AppendLine("1. Trả lời bằng tiếng Việt, ngắn gọn, súc tích (khoảng 2-4 đoạn hoặc gạch đầu dòng rõ ràng).");
        promptBuilder.AppendLine("2. Tập trung vào tiến độ, phân bổ nguồn lực và giải pháp tháo gỡ điểm nghẽn của dự án.");
        promptBuilder.AppendLine("3. Giữ văn phong chuyên nghiệp, khích lệ tinh thần đồng đội.");
        promptBuilder.AppendLine("4. Trình bày sạch sẽ, phân đoạn mạch lạc, không lặp lại dấu hoa thị hay ký tự thừa.");

        string aiAnswer;
        try
        {
            aiAnswer = await _aiTextGenerator.GenerateAsync(SystemInstruction, promptBuilder.ToString(), false, cancellationToken);
            if (string.IsNullOrWhiteSpace(aiAnswer))
            {
                aiAnswer = "Trợ lý AI đã tiếp nhận câu hỏi nhưng chưa có phản hồi thích hợp lúc này.";
            }
        }
        catch (AiUnavailableException)
        {
            aiAnswer = "Trợ lý AI hiện chưa thể phản hồi do API Key Gemini chưa được cấu hình hoặc đã chạm giới hạn. Bạn có thể kiểm tra cấu hình trong hệ thống.";
        }
        catch (Exception)
        {
            aiAnswer = "Hệ thống AI đang tạm thời gián đoạn kết nối. Vui lòng thử lại sau ít phút.";
        }

        var aiMessage = new ProjectChatMessage
        {
            ProjectId = project.Id,
            SenderId = null,
            SenderName = "Trợ lý AI Gemini",
            Content = aiAnswer.Trim(),
            IsAiGenerated = true
        };

        await _chatMessageRepository.AddAsync(aiMessage, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var aiMessageDto = new ProjectChatMessageDto(
            aiMessage.Id,
            aiMessage.ProjectId,
            aiMessage.SenderId,
            aiMessage.SenderName,
            aiMessage.Content,
            aiMessage.IsAiGenerated,
            aiMessage.CreatedAt);

        await _realtimeNotificationService.NotifyProjectMessageReceivedAsync(project.Id, aiMessageDto, cancellationToken);
    }
}
