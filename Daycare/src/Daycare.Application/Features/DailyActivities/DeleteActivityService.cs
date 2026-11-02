using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.DailyActivities;

public interface IDeleteActivityService
{
    Task ExecuteAsync(Guid activityId, CancellationToken cancellationToken = default);
}

public class DeleteActivityService : IDeleteActivityService
{
    private readonly IDaycareDbContext _db;

    public DeleteActivityService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task ExecuteAsync(Guid activityId, CancellationToken cancellationToken = default)
    {
        if (activityId == Guid.Empty)
            throw new ArgumentException("A valid activityId is required.", nameof(activityId));

        var activity = await _db.DailyActivities
            .FirstOrDefaultAsync(a => a.Id == activityId, cancellationToken);

        if (activity is null)
            throw new KeyNotFoundException($"Daily activity with ID '{activityId}' was not found.");

        _db.DailyActivities.Remove(activity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
