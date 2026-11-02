using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.Children;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Meals;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Children;

public interface IGetChildDailyHistoryService
{
    Task<ChildDailyHistoryResponse> ExecuteAsync(Guid childId, DateOnly date, CancellationToken cancellationToken = default);
}

public class GetChildDailyHistoryService : IGetChildDailyHistoryService
{
    private readonly IDaycareDbContext _db;

    public GetChildDailyHistoryService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ChildDailyHistoryResponse> ExecuteAsync(Guid childId, DateOnly date, CancellationToken cancellationToken = default)
    {
        if (childId == Guid.Empty)
            throw new ArgumentException("A valid childId is required.", nameof(childId));

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");

        var childName = $"{child.FirstName} {child.LastName}".Trim();

        // 1. Attendance for date
        var attendanceEntity = await _db.Attendances
            .Include(a => a.RecordedBy)
            .FirstOrDefaultAsync(a => a.ChildId == childId && a.Date == date, cancellationToken);

        AttendanceResponse? attendance = attendanceEntity is null ? null : new AttendanceResponse
        {
            Id = attendanceEntity.Id,
            ChildId = child.Id,
            ChildName = childName,
            Date = attendanceEntity.Date,
            ArrivalTime = attendanceEntity.ArrivalTime,
            DepartureTime = attendanceEntity.DepartureTime,
            IsPresent = attendanceEntity.IsPresent,
            Status = attendanceEntity.Status,
            PickedUpBy = attendanceEntity.PickedUpBy,
            PickedUpByPickupId = attendanceEntity.PickedUpByPickupId,
            UnverifiedPickup = attendanceEntity.UnverifiedPickup,
            Mood = attendanceEntity.Mood,
            DurationMinutes = attendanceEntity.DepartureTime.HasValue && attendanceEntity.ArrivalTime.HasValue
                ? Math.Max(0, (attendanceEntity.DepartureTime.Value - attendanceEntity.ArrivalTime.Value).TotalMinutes)
                : null,
            RecordedById = attendanceEntity.RecordedById,
            RecordedByName = attendanceEntity.RecordedBy != null
                ? $"{attendanceEntity.RecordedBy.FirstName} {attendanceEntity.RecordedBy.LastName}".Trim()
                : string.Empty,
            Note = attendanceEntity.Note,
            CreatedAt = attendanceEntity.CreatedAt,
            UpdatedAt = attendanceEntity.UpdatedAt
        };

        // 2. Meals for date (UTC range for that DateOnly)
        var startOfDay = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var endOfDay = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

        var mealEntities = await _db.Meals
            .Include(m => m.Staff)
            .Where(m => m.ChildId == childId && m.MealTime >= startOfDay && m.MealTime <= endOfDay)
            .OrderBy(m => m.MealTime)
            .ToListAsync(cancellationToken);

        var meals = mealEntities.Select(m => new MealResponse
        {
            Id = m.Id,
            ChildId = child.Id,
            ChildName = childName,
            StaffId = m.StaffId,
            StaffName = m.Staff != null ? $"{m.Staff.FirstName} {m.Staff.LastName}".Trim() : string.Empty,
            Type = m.Type,
            Food = m.Food,
            MealTime = m.MealTime,
            Status = m.Status,
            Notes = m.Notes,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        }).ToList();

        // 3. Daily activities for date
        var activityEntities = await _db.DailyActivities
            .Include(da => da.RecordedBy)
            .Where(da => da.ChildId == childId && da.StartTime >= startOfDay && da.StartTime <= endOfDay)
            .OrderBy(da => da.StartTime)
            .ToListAsync(cancellationToken);

        var activities = activityEntities.Select(da => new DailyActivityResponse
        {
            Id = da.Id,
            ChildId = child.Id,
            ChildName = childName,
            RecordedById = da.RecordedById,
            RecordedByName = da.RecordedBy != null ? $"{da.RecordedBy.FirstName} {da.RecordedBy.LastName}".Trim() : string.Empty,
            ActivityType = da.ActivityType,
            StartTime = da.StartTime,
            EndTime = da.EndTime,
            ActivityDescription = da.ActivityDescription,
            Note = da.Note,
            CreatedAt = da.CreatedAt,
            UpdatedAt = da.UpdatedAt
        }).ToList();

        return new ChildDailyHistoryResponse
        {
            ChildId = child.Id,
            ChildName = childName,
            Date = date,
            Attendance = attendance,
            Meals = meals,
            Activities = activities
        };
    }
}
