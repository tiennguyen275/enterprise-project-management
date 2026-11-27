using EnterpriseProjectManagement.Domain.Entities;

namespace EnterpriseProjectManagement.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
