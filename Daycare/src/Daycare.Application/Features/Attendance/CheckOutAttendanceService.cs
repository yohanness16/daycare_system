using Daycare.Application.Common;
using Daycare.Application.DTOs.Attendance;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Attendance;

public interface ICheckOutAttendanceService
{
    Task<AttendanceResponse> ExecuteAsync(CheckOutAttendanceRequest request, CancellationToken cancellationToken = default);
}

public class CheckOutAttendanceService : ICheckOutAttendanceService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService? _currentUserService;

    public CheckOutAttendanceService(IDaycareDbContext db, ICurrentUserService? currentUserService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService;
    }

    public async Task<AttendanceResponse> ExecuteAsync(CheckOutAttendanceRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ChildId == Guid.Empty)
            throw new ArgumentException("A valid ChildId is required.", nameof(request.ChildId));

        var staff = await StaffResolver.ResolveStaffAsync(_db, _currentUserService, request.RecordedById, cancellationToken);

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        // Normalize exit time to UTC
        var exitTime = request.ExitTime.HasValue
            ? DateTime.SpecifyKind(request.ExitTime.Value.ToUniversalTime(), DateTimeKind.Utc)
            : DateTime.UtcNow;

        var targetDate = request.Date ?? DateOnly.FromDateTime(exitTime);

        var attendance = await _db.Attendances
            .FirstOrDefaultAsync(a => a.ChildId == request.ChildId && a.Date == targetDate, cancellationToken);

        // Fallback: check if there's an open check-in on today's UTC date
        if (attendance is null && !request.Date.HasValue)
        {
            var utcToday = DateOnly.FromDateTime(DateTime.UtcNow);
            attendance = await _db.Attendances
                .FirstOrDefaultAsync(a => a.ChildId == request.ChildId && a.Date == utcToday, cancellationToken);
        }

        if (attendance is null)
        {
            throw new InvalidOperationException($"No check-in attendance record found for child '{child.FirstName} {child.LastName}' on {targetDate:yyyy-MM-dd}.");
        }

        if (attendance.ArrivalTime.HasValue && exitTime < attendance.ArrivalTime.Value)
        {
            throw new ArgumentException("Departure time cannot be earlier than arrival time.", nameof(request.ExitTime));
        }

        attendance.DepartureTime = exitTime;
        attendance.Status = AttendanceStatus.CheckedOut;

        if (!string.IsNullOrWhiteSpace(request.PickedUpBy))
            attendance.PickedUpBy = request.PickedUpBy.Trim();

        if (request.PickedUpByPickupId.HasValue)
            attendance.PickedUpByPickupId = request.PickedUpByPickupId.Value;

        attendance.UnverifiedPickup = request.UnverifiedPickup;
        attendance.RecordedById = staff.Id;

        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            attendance.Note = string.IsNullOrWhiteSpace(attendance.Note)
                ? request.Note.Trim()
                : $"{attendance.Note}; {request.Note.Trim()}";
        }
        attendance.UpdatedAt = DateTime.UtcNow;

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
