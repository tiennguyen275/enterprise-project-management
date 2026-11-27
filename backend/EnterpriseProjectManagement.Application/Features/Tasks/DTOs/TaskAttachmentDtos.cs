namespace EnterpriseProjectManagement.Application.Features.Tasks.DTOs;

public record TaskAttachmentDto(
    Guid Id,
    Guid TaskId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string UploadedByName,
    DateTime CreatedAt
);

public record TaskAttachmentFileDto(
    string FileName,
    string ContentType,
    string StoredFileName
);
