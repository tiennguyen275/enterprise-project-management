using System.Text;
using EnterpriseProjectManagement.Application;
using EnterpriseProjectManagement.Infrastructure;
using EnterpriseProjectManagement.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Đăng ký Application Services (AuthService, Business logic)
builder.Services.AddApplicationServices();

// Đăng ký Infrastructure (EF Core, DbContext, Repository, UnitOfWork, JWT Token Generator)
builder.Services.AddInfrastructureServices(builder.Configuration);

// Cấu hình JWT Authentication
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

// Cấu hình CORS để Frontend ReactJS có thể gọi API
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

// Tự động kiểm tra và tạo Database/Tables nếu chưa có (Auto-Migrate khi khởi động)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
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
