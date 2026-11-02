using Daycare.Application.DTOs.Attendance;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Attendance;

public interface IGetChildAttendanceService
{
    Task<IReadOnlyList<AttendanceResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default);
}

public class GetChildAttendanceService : IGetChildAttendanceService
{
    private readonly IDaycareDbContext _db;

    public GetChildAttendanceService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<AttendanceResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var entities = await _db.Attendances
            .AsNoTracking()
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .Where(a => a.ChildId == childId)
            .OrderByDescending(a => a.Date)
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
