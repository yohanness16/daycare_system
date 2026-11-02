using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Guardians;

public interface IDeleteGuardianService
{
    Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class DeleteGuardianService : IDeleteGuardianService
{
    private readonly IDaycareDbContext _db;

    public DeleteGuardianService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var guardian = await _db.Guardians
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);

        if (guardian is null)
            throw new KeyNotFoundException($"Guardian with ID '{id}' was not found.");

        // Guard against deleting a guardian who has active children registered
        var childCount = await _db.Children
            .CountAsync(c => c.GuardianId == id, cancellationToken);

        if (childCount > 0)
        {
            throw new Daycare.Domain.Exceptions.HasDependentsException(
                $"Cannot delete guardian '{guardian.FirstName} {guardian.LastName}' because {childCount} child(ren) are registered under them.",
                new Dictionary<string, int> { { "children", childCount } });
        }


        _db.Guardians.Remove(guardian);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
