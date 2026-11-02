using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.DailyActivities;

public interface IGetDailyActivitiesService
{
    Task<IReadOnlyList<DailyActivityResponse>> ExecuteAsync(DateOnly date, CancellationToken cancellationToken = default);
}

public class GetDailyActivitiesService : IGetDailyActivitiesService
{
    private readonly IDaycareDbContext _db;

    public GetDailyActivitiesService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<DailyActivityResponse>> ExecuteAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        var startOfDay = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endOfDay = date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        return await _db.DailyActivities
            .AsNoTracking()
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .Where(a => a.StartTime >= startOfDay && a.StartTime <= endOfDay)
            .OrderBy(a => a.StartTime)
            .Select(a => new DailyActivityResponse
            {
                Id = a.Id,
                ChildId = a.ChildId,
                ChildName = a.Child != null ? $"{a.Child.FirstName} {a.Child.LastName}".Trim() : string.Empty,
                RecordedById = a.RecordedById,
                RecordedByName = a.RecordedBy != null ? $"{a.RecordedBy.FirstName} {a.RecordedBy.LastName}".Trim() : string.Empty,
                ActivityType = a.ActivityType,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                ActivityDescription = a.ActivityDescription,
                Note = a.Note,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
