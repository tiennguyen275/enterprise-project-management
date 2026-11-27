using System.Linq.Expressions;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using EnterpriseProjectManagement.Domain.Common;

namespace EnterpriseProjectManagement.Tests.TestDoubles;

public class InMemoryRepository<T> : IRepository<T> where T : BaseEntity
{
    private readonly List<T> _items = new();

    public InMemoryRepository(IEnumerable<T>? seed = null)
    {
        if (seed != null)
        {
            _items.AddRange(seed);
        }
    }

    public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(_items.FirstOrDefault(x => !x.IsDeleted && x.Id == id));

    public Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<T>>(_items.Where(x => !x.IsDeleted).ToList());

    public Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var compiled = predicate.Compile();
        return Task.FromResult<IReadOnlyList<T>>(_items.Where(x => !x.IsDeleted && compiled(x)).ToList());
    }

    public Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        _items.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        var idx = _items.FindIndex(x => x.Id == entity.Id);
        if (idx >= 0) _items[idx] = entity;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.IsDeleted = true;
        return Task.CompletedTask;
    }
}

public class FakeUnitOfWork : IUnitOfWork
{
    public int SaveCount { get; private set; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveCount++;
        return Task.FromResult(1);
    }

    public void Dispose()
    {
    }
}
