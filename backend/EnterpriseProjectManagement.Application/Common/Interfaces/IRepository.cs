using System.Linq.Expressions;
using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Application.Common.Interfaces;

/// <summary>
/// Repository Pattern Interface: Đảm bảo nguyên lý Dependency Inversion (D trong SOLID)
/// và Interface Segregation (I trong SOLID).
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
}
