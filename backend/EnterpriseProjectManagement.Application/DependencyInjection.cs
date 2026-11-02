using EnterpriseProjectManagement.Application.Features.Auth.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EnterpriseProjectManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
