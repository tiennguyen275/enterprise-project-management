using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Infrastructure.Data;

namespace EnterpriseProjectManagement.Infrastructure.Repositories;

/// <summary>
/// Unit of Work Pattern: Đảm bảo ACID transaction
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
