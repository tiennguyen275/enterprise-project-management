using EnterpriseProjectManagement.Application.Features.Schedule.DTOs;

namespace EnterpriseProjectManagement.Application.Features.Schedule.Services;

public interface IScheduleService
{
    Task<ProjectCpmScheduleResponseDto> GetProjectScheduleAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskDependencyDto>> GetDependenciesAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TaskDependencyDto> AddDependencyAsync(Guid projectId, CreateTaskDependencyRequestDto request, CancellationToken cancellationToken = default);
    Task RemoveDependencyAsync(Guid projectId, Guid dependencyId, CancellationToken cancellationToken = default);
}
