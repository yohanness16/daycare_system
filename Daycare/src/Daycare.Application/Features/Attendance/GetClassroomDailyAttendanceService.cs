using Daycare.Application.DTOs.Attendance;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Attendance;

public interface IGetClassroomDailyAttendanceService
{
    Task<IReadOnlyList<AttendanceResponse>> ExecuteAsync(Guid classroomId, DateOnly date, CancellationToken cancellationToken = default);
}

public class GetClassroomDailyAttendanceService : IGetClassroomDailyAttendanceService
{
    private readonly IDaycareDbContext _db;

    public GetClassroomDailyAttendanceService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<AttendanceResponse>> ExecuteAsync(Guid classroomId, DateOnly date, CancellationToken cancellationToken = default)
    {
        if (classroomId == Guid.Empty)
            throw new ArgumentException("A valid classroomId is required.", nameof(classroomId));

        var enrolledChildIds = await _db.Enrollments
            .AsNoTracking()
            .Where(e => e.ClassroomId == classroomId && e.Status == EnrollmentStatus.Active)
            .Select(e => e.ChildId)
            .ToListAsync(cancellationToken);

        if (enrolledChildIds.Count == 0)
            return Array.Empty<AttendanceResponse>();

        var entities = await _db.Attendances
            .AsNoTracking()
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .Where(a => a.Date == date && enrolledChildIds.Contains(a.ChildId))
            .OrderBy(a => a.Child != null ? a.Child.LastName : string.Empty)
            .ThenBy(a => a.Child != null ? a.Child.FirstName : string.Empty)
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
