namespace EnterpriseProjectManagement.Application.Features.Auth.DTOs;

public record RegisterRequestDto(string Email, string Password, string FullName);

public record LoginRequestDto(string Email, string Password);

public record AuthResponseDto(Guid UserId, string Email, string FullName, string Token, DateTime ExpiresAt);

public record ForgotPasswordRequestDto(string Email);

public record VerifyOtpRequestDto(string Email, string Otp);

public record ResetPasswordRequestDto(string Email, string Otp, string NewPassword);

public record GoogleLoginRequestDto(string Email, string FullName, string? GoogleId, string? AvatarUrl);

public record ForgotPasswordResponseDto(string Message, string? DemoOtp = null);
