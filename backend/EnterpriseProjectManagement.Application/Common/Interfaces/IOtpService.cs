namespace EnterpriseProjectManagement.Application.Common.Interfaces;

public interface IOtpService
{
    string GenerateOtp(string email);
    bool VerifyOtp(string email, string otp);
    void InvalidateOtp(string email);
}
