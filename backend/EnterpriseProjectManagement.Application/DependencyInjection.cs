using EnterpriseProjectManagement.Application.Features.AiAssistant.Services;
using EnterpriseProjectManagement.Application.Features.Auth.Services;
using EnterpriseProjectManagement.Application.Features.MeetingNotes.Services;
using EnterpriseProjectManagement.Application.Features.Projects.Services;
using EnterpriseProjectManagement.Application.Features.StatusReports.Services;
using EnterpriseProjectManagement.Application.Features.Tasks.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EnterpriseProjectManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IMeetingNoteService, MeetingNoteService>();
        services.AddScoped<IStatusReportService, StatusReportService>();
        services.AddScoped<IAiAssistantService, AiAssistantService>();
        return services;
    }
}
