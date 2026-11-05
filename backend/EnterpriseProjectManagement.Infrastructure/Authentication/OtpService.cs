using System.Collections.Concurrent;
using System.Security.Cryptography;
using EnterpriseProjectManagement.Application.Common.Interfaces;

namespace EnterpriseProjectManagement.Infrastructure.Authentication;

public class OtpService : IOtpService
{
    private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> OtpCache = new();

    public string GenerateOtp(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var expiry = DateTime.UtcNow.AddMinutes(10);
        OtpCache[normalizedEmail] = (code, expiry);
        return code;
    }

    public bool VerifyOtp(string email, string otp)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (!OtpCache.TryGetValue(normalizedEmail, out var entry))
        {
            return false;
        }

        if (DateTime.UtcNow > entry.Expiry)
        {
            OtpCache.TryRemove(normalizedEmail, out _);
            return false;
        }

        return string.Equals(entry.Otp.Trim(), otp.Trim(), StringComparison.Ordinal);
    }

    public void InvalidateOtp(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        OtpCache.TryRemove(normalizedEmail, out _);
    }
}
