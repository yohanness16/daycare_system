using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.DailyActivities;

public interface IUpdateActivityService
{
    Task<DailyActivityResponse> ExecuteAsync(Guid activityId, UpdateActivityRequest request, CancellationToken cancellationToken = default);
}

public class UpdateActivityService : IUpdateActivityService
{
    private readonly IDaycareDbContext _db;

    public UpdateActivityService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<DailyActivityResponse> ExecuteAsync(Guid activityId, UpdateActivityRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (activityId == Guid.Empty)
            throw new ArgumentException("A valid activityId is required.", nameof(activityId));

        if (request.EndTime.HasValue && request.EndTime < request.StartTime)
        {
            throw new ArgumentException("EndTime cannot be earlier than StartTime.", nameof(request.EndTime));
        }

        var activity = await _db.DailyActivities
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .FirstOrDefaultAsync(a => a.Id == activityId, cancellationToken);

        if (activity is null)
            throw new KeyNotFoundException($"Daily activity with ID '{activityId}' was not found.");

        if (request.RecordedById.HasValue && request.RecordedById.Value != Guid.Empty && request.RecordedById.Value != activity.RecordedById)
        {
            var staffExists = await _db.Staff.AnyAsync(s => s.Id == request.RecordedById.Value, cancellationToken);
            if (!staffExists)
                throw new KeyNotFoundException($"Staff member with ID '{request.RecordedById.Value}' was not found.");

            activity.RecordedById = request.RecordedById.Value;
        }

        activity.ActivityType = request.ActivityType;
        activity.StartTime = request.StartTime == default ? activity.StartTime : request.StartTime;
        activity.EndTime = request.EndTime;
        activity.ActivityDescription = request.ActivityDescription?.Trim() ?? string.Empty;
        activity.Note = request.Note?.Trim() ?? string.Empty;
        activity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var staff = activity.RecordedById.HasValue
            ? await _db.Staff.FirstOrDefaultAsync(s => s.Id == activity.RecordedById.Value, cancellationToken)
            : null;

        return new DailyActivityResponse
        {
            Id = activity.Id,
            ChildId = activity.ChildId,
            ChildName = activity.Child != null ? $"{activity.Child.FirstName} {activity.Child.LastName}".Trim() : string.Empty,
            RecordedById = activity.RecordedById,
            RecordedByName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : string.Empty,
            ActivityType = activity.ActivityType,
            StartTime = activity.StartTime,
            EndTime = activity.EndTime,
            ActivityDescription = activity.ActivityDescription,
            Note = activity.Note,
            CreatedAt = activity.CreatedAt,
            UpdatedAt = activity.UpdatedAt
        };
    }
}
