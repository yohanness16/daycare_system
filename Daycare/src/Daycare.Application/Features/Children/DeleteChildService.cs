using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Children;

public interface IDeleteChildService
{
    Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class DeleteChildService : IDeleteChildService
{
    private readonly IDaycareDbContext _db;

    public DeleteChildService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{id}' was not found.");

        var enrollments = await _db.Enrollments.CountAsync(e => e.ChildId == id, cancellationToken);
        var attendances = await _db.Attendances.CountAsync(a => a.ChildId == id, cancellationToken);
        var meals = await _db.Meals.CountAsync(m => m.ChildId == id, cancellationToken);
        var activities = await _db.DailyActivities.CountAsync(da => da.ChildId == id, cancellationToken);

        if (enrollments > 0 || attendances > 0 || meals > 0 || activities > 0)
        {
            throw new Daycare.Domain.Exceptions.HasDependentsException(
                $"Cannot delete child '{child.FirstName} {child.LastName}' because they have associated records.",
                new Dictionary<string, int>
                {
                    { "enrollments", enrollments },
                    { "attendances", attendances },
                    { "meals", meals },
                    { "activities", activities }
                });
        }

        _db.Children.Remove(child);
        await _db.SaveChangesAsync(cancellationToken);
    }
}

