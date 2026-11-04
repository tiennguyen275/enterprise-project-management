using System.Text;
using EnterpriseProjectManagement.Api.Hubs;
using EnterpriseProjectManagement.Api.Services;
using EnterpriseProjectManagement.Application;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Infrastructure;
using EnterpriseProjectManagement.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddScoped<IRealtimeNotificationService, SignalRRealtimeNotificationService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Enterprise Project Management API",
        Version = "v1",
        Description = "Hệ thống Quản lý và Điều phối Dự án Doanh nghiệp theo mô hình Clean Architecture"
    });

    options.InferSecuritySchemes();
});

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

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
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

        IF OBJECT_ID(N'dbo.ProjectChatMessages', N'U') IS NULL
        BEGIN
            CREATE TABLE [dbo].[ProjectChatMessages] (
                [Id] uniqueidentifier NOT NULL,
                [ProjectId] uniqueidentifier NOT NULL,
                [SenderId] uniqueidentifier NULL,
                [SenderName] nvarchar(100) NOT NULL,
                [Content] nvarchar(max) NOT NULL,
                [IsAiGenerated] bit NOT NULL,
                [CreatedAt] datetime2 NOT NULL,
                [CreatedBy] nvarchar(max) NULL,
                [UpdatedAt] datetime2 NULL,
                [UpdatedBy] nvarchar(max) NULL,
                [IsDeleted] bit NOT NULL,
                CONSTRAINT [PK_ProjectChatMessages] PRIMARY KEY ([Id]),
                CONSTRAINT [FK_ProjectChatMessages_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [dbo].[Projects] ([Id]) ON DELETE CASCADE,
                CONSTRAINT [FK_ProjectChatMessages_Users_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE SET NULL
            );
            CREATE INDEX [IX_ProjectChatMessages_ProjectId] ON [dbo].[ProjectChatMessages] ([ProjectId]);
        END

        IF OBJECT_ID(N'dbo.TaskDependencies', N'U') IS NULL
        BEGIN
            CREATE TABLE [dbo].[TaskDependencies] (
                [Id] uniqueidentifier NOT NULL,
                [ProjectId] uniqueidentifier NOT NULL,
                [PredecessorTaskId] uniqueidentifier NOT NULL,
                [SuccessorTaskId] uniqueidentifier NOT NULL,
                [LagDays] int NOT NULL,
                [CreatedAt] datetime2 NOT NULL,
                [CreatedBy] nvarchar(max) NULL,
                [UpdatedAt] datetime2 NULL,
                [UpdatedBy] nvarchar(max) NULL,
                [IsDeleted] bit NOT NULL,
                CONSTRAINT [PK_TaskDependencies] PRIMARY KEY ([Id]),
                CONSTRAINT [FK_TaskDependencies_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [dbo].[Projects] ([Id]) ON DELETE CASCADE,
                CONSTRAINT [FK_TaskDependencies_ProjectTasks_PredecessorTaskId] FOREIGN KEY ([PredecessorTaskId]) REFERENCES [dbo].[ProjectTasks] ([Id]) ON DELETE NO ACTION,
                CONSTRAINT [FK_TaskDependencies_ProjectTasks_SuccessorTaskId] FOREIGN KEY ([SuccessorTaskId]) REFERENCES [dbo].[ProjectTasks] ([Id]) ON DELETE NO ACTION
            );
            CREATE UNIQUE INDEX [IX_TaskDependencies_Predecessor_Successor] ON [dbo].[TaskDependencies] ([PredecessorTaskId], [SuccessorTaskId]) WHERE [IsDeleted] = 0;
            CREATE INDEX [IX_TaskDependencies_ProjectId] ON [dbo].[TaskDependencies] ([ProjectId]);
        END
    ");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Enterprise Project Management API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ProjectHub>("/hubs/project");

app.Run();
