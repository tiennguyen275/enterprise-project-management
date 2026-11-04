using System.Text;
using EnterpriseProjectManagement.Application;
using EnterpriseProjectManagement.Infrastructure;
using EnterpriseProjectManagement.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

var secret = builder.Configuration["JwtSettings:Secret"] ?? "EnterpriseProjectManagementSuperSecretKey2026!@#$%";
var issuer = builder.Configuration["JwtSettings:Issuer"] ?? "EnterpriseProjectManagement";
var audience = builder.Configuration["JwtSettings:Audience"] ?? "EnterpriseProjectManagement";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
    dbContext.Database.ExecuteSqlRaw(@"
        IF OBJECT_ID(N'dbo.ProjectStatusReports', N'U') IS NULL
        BEGIN
            CREATE TABLE [dbo].[ProjectStatusReports] (
                [Id] uniqueidentifier NOT NULL,
                [ProjectId] uniqueidentifier NOT NULL,
                [Title] nvarchar(250) NOT NULL,
                [ReportStartDate] datetime2 NOT NULL,
                [ReportEndDate] datetime2 NOT NULL,
                [HealthRating] int NOT NULL,
                [KeyAccomplishments] nvarchar(max) NOT NULL,
                [UpcomingPlan] nvarchar(max) NULL,
                [RisksAndBlockers] nvarchar(max) NULL,
                [TotalTasksSnapshot] int NOT NULL,
                [CompletedTasksSnapshot] int NOT NULL,
                [OverdueTasksSnapshot] int NOT NULL,
                [CompletionRateSnapshot] decimal(5,2) NOT NULL,
                [CreatedAt] datetime2 NOT NULL,
                [CreatedBy] nvarchar(max) NULL,
                [UpdatedAt] datetime2 NULL,
                [UpdatedBy] nvarchar(max) NULL,
                [IsDeleted] bit NOT NULL,
                CONSTRAINT [PK_ProjectStatusReports] PRIMARY KEY ([Id]),
                CONSTRAINT [FK_ProjectStatusReports_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [dbo].[Projects] ([Id]) ON DELETE CASCADE
            );
            CREATE INDEX [IX_ProjectStatusReports_ProjectId] ON [dbo].[ProjectStatusReports] ([ProjectId]);
        END
    ");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
