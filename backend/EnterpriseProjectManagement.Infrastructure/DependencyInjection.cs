using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Infrastructure.Ai;
using EnterpriseProjectManagement.Infrastructure.Authentication;
using EnterpriseProjectManagement.Infrastructure.Data;
using EnterpriseProjectManagement.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace EnterpriseProjectManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=EnterpriseProjectDb;Trusted_Connection=True;MultipleActiveResultSets=true";

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        services.Configure<GeminiSettings>(configuration.GetSection(GeminiSettings.SectionName));
        services.AddHttpClient<IAiTextGenerator, GeminiTextGenerator>((provider, client) =>
        {
            var settings = provider.GetRequiredService<IOptions<GeminiSettings>>().Value;
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
        });

        return services;
    }
}
