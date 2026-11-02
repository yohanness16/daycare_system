using Daycare.Application.Common;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.DailyActivities;

public interface IRecordActivityService
{
    Task<DailyActivityResponse> ExecuteAsync(RecordActivityRequest request, CancellationToken cancellationToken = default);
}

public class RecordActivityService : IRecordActivityService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService? _currentUserService;

    public RecordActivityService(IDaycareDbContext db, ICurrentUserService? currentUserService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService;
    }

    public async Task<DailyActivityResponse> ExecuteAsync(RecordActivityRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ChildId == Guid.Empty)
            throw new ArgumentException("A valid ChildId is required.", nameof(request.ChildId));

        if (request.EndTime.HasValue && request.EndTime < request.StartTime)
        {
            throw new ArgumentException("EndTime cannot be earlier than StartTime.", nameof(request.EndTime));
        }

        var staff = await StaffResolver.ResolveStaffAsync(_db, _currentUserService, request.RecordedById, cancellationToken);

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        var isEnrolled = await _db.Enrollments
            .AnyAsync(e => e.ChildId == request.ChildId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (!isEnrolled)
            throw new InvalidOperationException($"Child '{child.FirstName} {child.LastName}' is not actively enrolled in any classroom.");

        var activity = new DailyActivity
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            RecordedById = staff.Id,
            ActivityType = request.ActivityType,
            StartTime = request.StartTime == default ? DateTime.UtcNow : request.StartTime,
            EndTime = request.EndTime,
            ActivityDescription = request.ActivityDescription.Trim(),
            Note = request.Note.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.DailyActivities.Add(activity);
        await _db.SaveChangesAsync(cancellationToken);

        return new DailyActivityResponse
        {
            Id = activity.Id,
            ChildId = child.Id,
            ChildName = $"{child.FirstName} {child.LastName}".Trim(),
            RecordedById = staff.Id,
            RecordedByName = $"{staff.FirstName} {staff.LastName}".Trim(),
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
