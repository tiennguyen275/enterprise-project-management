using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Application.Features.Auth.DTOs;
using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Features.Auth.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<bool> VerifyOtpAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request, CancellationToken cancellationToken = default);
}

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IOtpService _otpService;

    public AuthService(
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork,
        IJwtTokenGenerator jwtTokenGenerator,
        IOtpService otpService)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _jwtTokenGenerator = jwtTokenGenerator;
        _otpService = otpService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (existingUser.Any())
        {
            throw new InvalidOperationException("Email này đã được sử dụng trong hệ thống.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var newUser = new User
        {
            Email = request.Email.Trim().ToLower(),
            FullName = request.FullName.Trim(),
            PasswordHash = passwordHash,
            IsActive = true
        };

        await _userRepository.AddAsync(newUser, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenGenerator.GenerateToken(newUser);
        return new AuthResponseDto(newUser.Id, newUser.Email, newUser.FullName, token, DateTime.UtcNow.AddDays(7));
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        var user = users.FirstOrDefault();

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị tạm khóa.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        return new AuthResponseDto(user.Id, user.Email, user.FullName, token, DateTime.UtcNow.AddDays(7));
    }

    public async Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower(), cancellationToken);
        var user = users.FirstOrDefault();
        if (user == null)
        {
            throw new KeyNotFoundException("Không tìm thấy tài khoản với email này.");
        }

        var otp = _otpService.GenerateOtp(user.Email);
        return new ForgotPasswordResponseDto(
            $"Mã OTP xác thực đặt lại mật khẩu đã được tạo cho email {user.Email}. Mã có hiệu lực trong 10 phút.",
            otp);
    }

    public Task<bool> VerifyOtpAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default)
    {
        var isValid = _otpService.VerifyOtp(request.Email, request.Otp);
        if (!isValid)
        {
            throw new InvalidOperationException("Mã OTP không chính xác hoặc đã hết hạn.");
        }
        return Task.FromResult(true);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var isValid = _otpService.VerifyOtp(request.Email, request.Otp);
        if (!isValid)
        {
            throw new InvalidOperationException("Mã OTP không chính xác hoặc đã hết hạn.");
        }

        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower(), cancellationToken);
        var user = users.FirstOrDefault();
        if (user == null)
        {
            throw new KeyNotFoundException("Không tìm thấy tài khoản để đặt lại mật khẩu.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _otpService.InvalidateOtp(request.Email);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLower();
        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        var user = users.FirstOrDefault();

        if (user == null)
        {
            var fallbackName = !string.IsNullOrWhiteSpace(request.FullName)
                ? request.FullName.Trim()
                : normalizedEmail.Split('@')[0];

            user = new User
            {
                Email = normalizedEmail,
                FullName = fallbackName,
                AvatarUrl = request.AvatarUrl,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                IsActive = true
            };

            await _userRepository.AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị tạm khóa.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        return new AuthResponseDto(user.Id, user.Email, user.FullName, token, DateTime.UtcNow.AddDays(7));
    }
}
