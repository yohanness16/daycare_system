using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.DailyActivities;

public interface IGetChildActivitiesService
{
    Task<IReadOnlyList<DailyActivityResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default);
}

public class GetChildActivitiesService : IGetChildActivitiesService
{
    private readonly IDaycareDbContext _db;

    public GetChildActivitiesService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<DailyActivityResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        return await _db.DailyActivities
            .AsNoTracking()
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .Where(a => a.ChildId == childId)
            .OrderByDescending(a => a.StartTime)
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
