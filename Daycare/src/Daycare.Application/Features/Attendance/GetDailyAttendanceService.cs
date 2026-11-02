using Daycare.Application.DTOs.Attendance;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Attendance;

public interface IGetDailyAttendanceService
{
    Task<IReadOnlyList<AttendanceResponse>> ExecuteAsync(DateOnly date, CancellationToken cancellationToken = default);
}

public class GetDailyAttendanceService : IGetDailyAttendanceService
{
    private readonly IDaycareDbContext _db;

    public GetDailyAttendanceService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<AttendanceResponse>> ExecuteAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        var entities = await _db.Attendances
            .AsNoTracking()
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .Where(a => a.Date == date)
            .OrderBy(a => a.Child != null ? a.Child.LastName : string.Empty)
            .ToListAsync(cancellationToken);

        return entities.Select(a => new AttendanceResponse
        {
            Id = a.Id,
            ChildId = a.ChildId,
            ChildName = a.Child != null ? $"{a.Child.FirstName} {a.Child.LastName}".Trim() : string.Empty,
            Date = a.Date,
            ArrivalTime = a.ArrivalTime,
            DepartureTime = a.DepartureTime,
            IsPresent = a.IsPresent,
            Status = a.Status,
            PickedUpBy = a.PickedUpBy,
            PickedUpByPickupId = a.PickedUpByPickupId,
            UnverifiedPickup = a.UnverifiedPickup,
            Mood = a.Mood,
            DurationMinutes = a.DepartureTime.HasValue && a.ArrivalTime.HasValue
                ? Math.Max(0, (a.DepartureTime.Value - a.ArrivalTime.Value).TotalMinutes)
                : null,
            RecordedById = a.RecordedById,
            RecordedByName = a.RecordedBy != null ? $"{a.RecordedBy.FirstName} {a.RecordedBy.LastName}".Trim() : string.Empty,
            Note = a.Note,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        }).ToList();
    }
}
