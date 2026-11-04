using System.Text;
using System.Text.Json;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.AiAssistant.DTOs;
using EnterpriseProjectManagement.Application.Features.StatusReports.Services;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;

namespace EnterpriseProjectManagement.Application.Features.AiAssistant.Services;

public interface IAiAssistantService
{
    Task<ProjectInsightResponseDto> GetProjectInsightAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<SubtaskSuggestionResponseDto> SuggestSubtasksAsync(Guid taskId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AssigneeSuggestionDto>> SuggestAssigneesAsync(Guid taskId, CancellationToken cancellationToken = default);
}

public class AiAssistantService : IAiAssistantService
{
    private const string SystemInstruction =
        "Bạn là trợ lý quản lý dự án phần mềm. Luôn trả lời bằng tiếng Việt, ngắn gọn, thực tế, " +
        "chỉ dựa trên dữ liệu được cung cấp và không bịa thêm số liệu.";

    private const int MaxSuggestions = 6;

    private readonly IAiTextGenerator _aiTextGenerator;
    private readonly IStatusReportService _statusReportService;
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IRepository<ProjectMember> _memberRepository;
    private readonly IRepository<User> _userRepository;

    public AiAssistantService(
        IAiTextGenerator aiTextGenerator,
        IStatusReportService statusReportService,
        IRepository<Project> projectRepository,
        IRepository<ProjectTask> taskRepository,
        IRepository<ProjectMember> memberRepository,
        IRepository<User> userRepository)
    {
        _aiTextGenerator = aiTextGenerator;
        _statusReportService = statusReportService;
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _memberRepository = memberRepository;
        _userRepository = userRepository;
    }

    public async Task<ProjectInsightResponseDto> GetProjectInsightAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new KeyNotFoundException("Không tìm thấy dự án.");
        }

        var overview = await _statusReportService.GetProjectHealthAndReportsAsync(projectId, null, null, cancellationToken);
        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId && t.ParentTaskId == null, cancellationToken);

        var today = DateTime.UtcNow.Date;
        var overdueTitles = tasks
            .Where(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != ProjectTaskStatus.Done)
            .OrderBy(t => t.DueDate)
            .Take(8)
            .Select(t => $"- {t.TaskCode}: {t.Title} (hạn {t.DueDate!.Value:dd/MM/yyyy})")
            .ToList();

        var builder = new StringBuilder();
        builder.AppendLine($"Dự án: {project.Name} ({project.Code})");
        builder.AppendLine($"Thời gian: {project.StartDate:dd/MM/yyyy} - {(project.EndDate.HasValue ? project.EndDate.Value.ToString("dd/MM/yyyy") : "chưa đặt")}");
        builder.AppendLine($"Tổng công việc: {overview.TotalTasks}, hoàn thành: {overview.CompletedTasks}, đang làm: {overview.InProgressTasks}, quá hạn: {overview.OverdueTasks}");
        builder.AppendLine($"Tỷ lệ hoàn thành: {overview.CompletionRate}%");
        builder.AppendLine($"Hệ thống chấm sức khỏe dự án: {overview.SuggestedRating} - {overview.HealthSummary}");

        if (overdueTitles.Count > 0)
        {
            builder.AppendLine("Công việc quá hạn:");
            foreach (var line in overdueTitles)
            {
                builder.AppendLine(line);
            }
        }

        builder.AppendLine();
        builder.AppendLine("Hãy viết nhận xét về tình hình dự án gồm 3 phần ngắn: (1) Đánh giá chung, (2) Rủi ro chính, (3) 2-3 việc nên làm ngay. Tối đa 150 từ.");

        var insight = await _aiTextGenerator.GenerateAsync(SystemInstruction, builder.ToString(), false, cancellationToken);
        return new ProjectInsightResponseDto(insight.Trim(), DateTime.UtcNow);
    }

    public async Task<SubtaskSuggestionResponseDto> SuggestSubtasksAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new KeyNotFoundException("Không tìm thấy công việc.");
        }

        var existing = await _taskRepository.FindAsync(t => t.ParentTaskId == taskId, cancellationToken);

        var builder = new StringBuilder();
        builder.AppendLine($"Công việc: {task.Title}");
        if (!string.IsNullOrWhiteSpace(task.Description))
        {
            builder.AppendLine($"Mô tả: {task.Description}");
        }

        if (existing.Count > 0)
        {
            builder.AppendLine("Các việc con đã có (không đề xuất lại):");
            foreach (var sub in existing)
            {
                builder.AppendLine($"- {sub.Title}");
            }
        }

        builder.AppendLine();
        builder.AppendLine($"Hãy chia công việc trên thành tối đa {MaxSuggestions} việc con cụ thể, mỗi việc dưới 12 từ, sắp theo thứ tự thực hiện.");
        builder.AppendLine("Chỉ trả về một mảng JSON các chuỗi, ví dụ: [\"Việc 1\", \"Việc 2\"]");

        var raw = await _aiTextGenerator.GenerateAsync(SystemInstruction, builder.ToString(), true, cancellationToken);
        var existingTitles = existing.Select(e => e.Title.Trim().ToLowerInvariant()).ToHashSet();

        var suggestions = ParseSuggestions(raw)
            .Where(s => !existingTitles.Contains(s.ToLowerInvariant()))
            .Take(MaxSuggestions)
            .ToList();

        return new SubtaskSuggestionResponseDto(suggestions);
    }

    public async Task<IReadOnlyList<AssigneeSuggestionDto>> SuggestAssigneesAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new KeyNotFoundException("Không tìm thấy công việc.");
        }

        var members = await _memberRepository.FindAsync(
            m => m.ProjectId == task.ProjectId && m.Role != ProjectRole.Viewer,
            cancellationToken);

        var memberIds = members.Select(m => m.UserId).Distinct().ToList();
        if (memberIds.Count == 0)
        {
            return Array.Empty<AssigneeSuggestionDto>();
        }

        var users = await _userRepository.FindAsync(u => memberIds.Contains(u.Id), cancellationToken);
        var openTasks = await _taskRepository.FindAsync(
            t => t.Id != taskId
                && t.ParentTaskId == null
                && t.Status != ProjectTaskStatus.Done
                && t.AssigneeId.HasValue
                && memberIds.Contains(t.AssigneeId.Value),
            cancellationToken);

        var workloads = users
            .Select(u =>
            {
                var assigned = openTasks.Where(t => t.AssigneeId == u.Id).ToList();
                return new
                {
                    u.Id,
                    u.FullName,
                    Count = assigned.Count,
                    Hours = assigned.Sum(t => t.EstimatedHours ?? 0m)
                };
            })
            .OrderBy(w => w.Hours)
            .ThenBy(w => w.Count)
            .ThenBy(w => w.FullName)
            .ToList();

        return workloads
            .Select((w, index) => new AssigneeSuggestionDto(w.Id, w.FullName, w.Count, w.Hours, index == 0))
            .ToList();
    }

    private static IReadOnlyList<string> ParseSuggestions(string raw)
    {
        var cleaned = raw.Trim();
        if (cleaned.StartsWith("```"))
        {
            var firstBreak = cleaned.IndexOf('\n');
            var lastFence = cleaned.LastIndexOf("```", StringComparison.Ordinal);
            if (firstBreak >= 0 && lastFence > firstBreak)
            {
                cleaned = cleaned.Substring(firstBreak + 1, lastFence - firstBreak - 1).Trim();
            }
        }

        try
        {
            var items = JsonSerializer.Deserialize<List<string>>(cleaned);
            if (items != null)
            {
                return items
                    .Select(i => i.Trim())
                    .Where(i => i.Length > 0)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
        }
        catch (JsonException)
        {
        }

        return cleaned
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(line => line.TrimStart('-', '*', ' ', '\t').Trim())
            .Where(line => line.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
