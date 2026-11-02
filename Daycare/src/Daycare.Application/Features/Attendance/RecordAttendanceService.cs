using Daycare.Application.Common;
using Daycare.Application.DTOs.Attendance;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Attendance;

public interface IRecordAttendanceService
{
    Task<AttendanceResponse> ExecuteAsync(RecordAttendanceRequest request, CancellationToken cancellationToken = default);
}

public class RecordAttendanceService : IRecordAttendanceService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService? _currentUserService;

    public RecordAttendanceService(IDaycareDbContext db, ICurrentUserService? currentUserService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService;
    }

    public async Task<AttendanceResponse> ExecuteAsync(RecordAttendanceRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ChildId == Guid.Empty)
            throw new ArgumentException("A valid ChildId is required.", nameof(request.ChildId));

        var staff = await StaffResolver.ResolveStaffAsync(_db, _currentUserService, request.RecordedById, cancellationToken);

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        var isEnrolled = await _db.Enrollments
            .AnyAsync(e => e.ChildId == request.ChildId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (!isEnrolled)
            throw new InvalidOperationException($"Child '{child.FirstName} {child.LastName}' is not actively enrolled in any classroom.");

        // Normalize time to UTC
        var arrivalTime = request.ArrivalTime.HasValue
            ? DateTime.SpecifyKind(request.ArrivalTime.Value.ToUniversalTime(), DateTimeKind.Utc)
            : DateTime.UtcNow;

        DateTime? exitTime = request.ExitTime.HasValue
            ? DateTime.SpecifyKind(request.ExitTime.Value.ToUniversalTime(), DateTimeKind.Utc)
            : null;

        if (exitTime.HasValue && exitTime.Value < arrivalTime)
        {
            throw new ArgumentException("Departure time cannot be earlier than arrival time.", nameof(request.ExitTime));
        }

        var today = DateOnly.FromDateTime(arrivalTime);

        var existingAttendance = await _db.Attendances
            .FirstOrDefaultAsync(a => a.ChildId == request.ChildId && a.Date == today, cancellationToken);

        Daycare.Domain.Entities.Attendance attendance;

        if (existingAttendance is not null)
        {
            if (request.ArrivalTime.HasValue)
            {
                if (existingAttendance.DepartureTime.HasValue && existingAttendance.DepartureTime.Value < arrivalTime)
                    throw new ArgumentException("Arrival time cannot be later than existing departure time.", nameof(request.ArrivalTime));

                existingAttendance.ArrivalTime = arrivalTime;
            }

            if (exitTime.HasValue)
            {
                if (existingAttendance.ArrivalTime.HasValue && exitTime.Value < existingAttendance.ArrivalTime.Value)
                    throw new ArgumentException("Departure time cannot be earlier than arrival time.", nameof(request.ExitTime));

                existingAttendance.DepartureTime = exitTime.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.Note))
                existingAttendance.Note = request.Note.Trim();

            if (request.Mood.HasValue)
                existingAttendance.Mood = request.Mood.Value;

            existingAttendance.Status = request.Status ?? (existingAttendance.DepartureTime.HasValue ? AttendanceStatus.CheckedOut : AttendanceStatus.Present);
            existingAttendance.IsPresent = existingAttendance.Status != AttendanceStatus.Absent && existingAttendance.Status != AttendanceStatus.NotArrived;
            existingAttendance.RecordedById = staff.Id;
            existingAttendance.UpdatedAt = DateTime.UtcNow;

            attendance = existingAttendance;
        }
        else
        {
            var status = request.Status ?? (exitTime.HasValue ? AttendanceStatus.CheckedOut : AttendanceStatus.Present);

            attendance = new Daycare.Domain.Entities.Attendance
            {
                Id = Guid.NewGuid(),
                ChildId = child.Id,
                Date = today,
                ArrivalTime = arrivalTime,
                DepartureTime = exitTime,
                IsPresent = status != AttendanceStatus.Absent && status != AttendanceStatus.NotArrived,
                Status = status,
                Mood = request.Mood,
                RecordedById = staff.Id,
                Note = request.Note.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Attendances.Add(attendance);
        }

        await _db.SaveChangesAsync(cancellationToken);

        double? durationMinutes = attendance.DepartureTime.HasValue && attendance.ArrivalTime.HasValue
            ? Math.Max(0, (attendance.DepartureTime.Value - attendance.ArrivalTime.Value).TotalMinutes)
            : null;

        return new AttendanceResponse
        {
            Id = attendance.Id,
            ChildId = child.Id,
            ChildName = $"{child.FirstName} {child.LastName}".Trim(),
            Date = attendance.Date,
            ArrivalTime = attendance.ArrivalTime,
            DepartureTime = attendance.DepartureTime,
            IsPresent = attendance.IsPresent,
            Status = attendance.Status,
            PickedUpBy = attendance.PickedUpBy,
            PickedUpByPickupId = attendance.PickedUpByPickupId,
            UnverifiedPickup = attendance.UnverifiedPickup,
            Mood = attendance.Mood,
            DurationMinutes = durationMinutes,
            RecordedById = staff.Id,
            RecordedByName = $"{staff.FirstName} {staff.LastName}".Trim(),
            Note = attendance.Note,
            CreatedAt = attendance.CreatedAt,
            UpdatedAt = attendance.UpdatedAt
        };
    }
}
