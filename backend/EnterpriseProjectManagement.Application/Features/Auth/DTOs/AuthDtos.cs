namespace EnterpriseProjectManagement.Application.Features.Auth.DTOs;

public record RegisterRequestDto(string Email, string Password, string FullName);

public record LoginRequestDto(string Email, string Password);

public record AuthResponseDto(Guid UserId, string Email, string FullName, string Token, DateTime ExpiresAt);
