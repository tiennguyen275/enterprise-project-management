using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Projects.Services;
using EnterpriseProjectManagement.Application.Features.Tasks.DTOs;
using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Features.Tasks.Services;

public interface ITaskAttachmentService
{
    Task<IReadOnlyList<TaskAttachmentDto>> GetAttachmentsAsync(Guid taskId, Guid requesterUserId, CancellationToken cancellationToken = default);
    Task<TaskAttachmentDto> SaveAttachmentRecordAsync(
        Guid taskId,
        Guid uploaderUserId,
        string fileName,
        string storedFileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default);
    Task<TaskAttachmentFileDto?> GetAttachmentFileAsync(Guid taskId, Guid attachmentId, Guid requesterUserId, CancellationToken cancellationToken = default);
    Task<string?> DeleteAttachmentAsync(Guid taskId, Guid attachmentId, Guid requesterUserId, CancellationToken cancellationToken = default);
    Task<Guid> ValidateTaskAccessAsync(Guid taskId, Guid requesterUserId, CancellationToken cancellationToken = default);
}

public class TaskAttachmentService : ITaskAttachmentService
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024;
    private static readonly Dictionary<string, string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".webp"] = "image/webp",
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".xls"] = "application/vnd.ms-excel",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".ppt"] = "application/vnd.ms-powerpoint",
        [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        [".txt"] = "text/plain",
        [".csv"] = "text/csv",
        [".zip"] = "application/zip"
    };

    private readonly IRepository<TaskAttachment> _attachmentRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IProjectService _projectService;
    private readonly IUnitOfWork _unitOfWork;

    public TaskAttachmentService(
        IRepository<TaskAttachment> attachmentRepository,
        IRepository<ProjectTask> taskRepository,
        IRepository<User> userRepository,
        IProjectService projectService,
        IUnitOfWork unitOfWork)
    {
        _attachmentRepository = attachmentRepository;
        _taskRepository = taskRepository;
        _userRepository = userRepository;
        _projectService = projectService;
        _unitOfWork = unitOfWork;
    }

    public static bool IsExtensionAllowed(string extension) =>
        !string.IsNullOrWhiteSpace(extension) && AllowedMimeTypes.ContainsKey(extension);

    public static string ResolveSafeContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        return !string.IsNullOrWhiteSpace(ext) && AllowedMimeTypes.TryGetValue(ext, out var mime)
            ? mime
            : "application/octet-stream";
    }

    public async Task<Guid> ValidateTaskAccessAsync(Guid taskId, Guid requesterUserId, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy công việc.");

        var canAccess = await _projectService.CanUserAccessProjectAsync(task.ProjectId, requesterUserId, cancellationToken);
        if (!canAccess)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập tệp đính kèm của công việc này.");
        }

        return task.ProjectId;
    }

    public async Task<IReadOnlyList<TaskAttachmentDto>> GetAttachmentsAsync(Guid taskId, Guid requesterUserId, CancellationToken cancellationToken = default)
    {
        await ValidateTaskAccessAsync(taskId, requesterUserId, cancellationToken);
        var items = await _attachmentRepository.FindAsync(a => a.TaskId == taskId, cancellationToken);
        return items
            .OrderByDescending(a => a.CreatedAt)
            .Select(MapDto)
            .ToList();
    }

    public async Task<TaskAttachmentDto> SaveAttachmentRecordAsync(
        Guid taskId,
        Guid uploaderUserId,
        string fileName,
        string storedFileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default)
    {
        await ValidateTaskAccessAsync(taskId, uploaderUserId, cancellationToken);
        if (fileSizeBytes <= 0 || fileSizeBytes > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("Kích thước tệp phải lớn hơn 0 và tối đa 10 MB.");
        }

        var safeName = Path.GetFileName(fileName).Trim();
        if (string.IsNullOrWhiteSpace(safeName))
        {
            throw new InvalidOperationException("Tên tệp không hợp lệ.");
        }

        var uploader = await _userRepository.GetByIdAsync(uploaderUserId, cancellationToken);
        var entity = new TaskAttachment
        {
            TaskId = taskId,
            UploadedById = uploaderUserId,
            UploadedByName = uploader?.FullName ?? "Thành viên",
            FileName = safeName.Length > 200 ? safeName[..200] : safeName,
            StoredFileName = storedFileName,
            ContentType = ResolveSafeContentType(safeName),
            FileSizeBytes = fileSizeBytes
        };

        await _attachmentRepository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapDto(entity);
    }

    public async Task<TaskAttachmentFileDto?> GetAttachmentFileAsync(Guid taskId, Guid attachmentId, Guid requesterUserId, CancellationToken cancellationToken = default)
    {
        await ValidateTaskAccessAsync(taskId, requesterUserId, cancellationToken);
        var entity = await _attachmentRepository.GetByIdAsync(attachmentId, cancellationToken);
        if (entity == null || entity.TaskId != taskId) return null;

        return new TaskAttachmentFileDto(entity.FileName, entity.ContentType, entity.StoredFileName);
    }

    public async Task<string?> DeleteAttachmentAsync(Guid taskId, Guid attachmentId, Guid requesterUserId, CancellationToken cancellationToken = default)
    {
        var projectId = await ValidateTaskAccessAsync(taskId, requesterUserId, cancellationToken);
        var entity = await _attachmentRepository.GetByIdAsync(attachmentId, cancellationToken);
        if (entity == null || entity.TaskId != taskId) return null;

        var isUploader = entity.UploadedById == requesterUserId;
        if (!isUploader && !await _projectService.CanUserManageProjectAsync(projectId, requesterUserId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Chỉ người tải lên hoặc Quản lý dự án mới có quyền xóa tệp đính kèm này.");
        }

        await _attachmentRepository.DeleteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.StoredFileName;
    }

    private static TaskAttachmentDto MapDto(TaskAttachment a) =>
        new(a.Id, a.TaskId, a.FileName, a.ContentType, a.FileSizeBytes, a.UploadedByName, a.CreatedAt);
}
