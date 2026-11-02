using EnterpriseProjectManagement.Application.Features.Auth.Services;
using EnterpriseProjectManagement.Application.Features.Projects.Services;
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
        return services;
    }
}
