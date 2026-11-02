namespace EnterpriseProjectManagement.Application.Common.Interfaces;

/// <summary>
/// Unit of Work Pattern: Quản lý transaction, đảm bảo tính toàn vẹn dữ liệu
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
