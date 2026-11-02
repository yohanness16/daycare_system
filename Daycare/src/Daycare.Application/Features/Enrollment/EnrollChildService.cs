using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface IEnrollChildService
{
    Task<EnrollmentResponse> ExecuteAsync(EnrollChildRequest request, CancellationToken cancellationToken = default);
}

public class EnrollChildService : IEnrollChildService
{
    private readonly IDaycareDbContext _db;

    public EnrollChildService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<EnrollmentResponse> ExecuteAsync(EnrollChildRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ChildId == Guid.Empty)
            throw new ArgumentException("A valid ChildId is required.", nameof(request.ChildId));

        if (request.ClassroomId == Guid.Empty)
            throw new ArgumentException("A valid ClassroomId is required.", nameof(request.ClassroomId));

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        var classroom = await _db.Classrooms
            .FirstOrDefaultAsync(c => c.Id == request.ClassroomId, cancellationToken);

        if (classroom is null)
            throw new KeyNotFoundException($"Classroom with ID '{request.ClassroomId}' was not found.");

        var isAlreadyEnrolled = await _db.Enrollments
            .AnyAsync(e => e.ChildId == request.ChildId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (isAlreadyEnrolled)
            throw new InvalidOperationException($"Child '{child.FirstName} {child.LastName}' is already actively enrolled.");

        var currentActiveCount = await _db.Enrollments
            .CountAsync(e => e.ClassroomId == request.ClassroomId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (currentActiveCount >= classroom.Capacity)
            throw new InvalidOperationException($"Classroom '{classroom.Name}' is at full capacity ({classroom.Capacity} max).");

        var enrollmentDate = request.EnrollmentDate == default ? DateTime.UtcNow : request.EnrollmentDate;

        var enrollment = new Daycare.Domain.Entities.Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = enrollmentDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Enrollments.Add(enrollment);
        await _db.SaveChangesAsync(cancellationToken);

        return new EnrollmentResponse
        {
            Id = enrollment.Id,
            ChildId = child.Id,
            ChildName = $"{child.FirstName} {child.LastName}".Trim(),
            ClassroomId = classroom.Id,
            ClassroomName = classroom.Name,
            Status = enrollment.Status,
            EnrollmentDate = enrollment.EnrollmentDate,
            EndDate = enrollment.EndDate,
            CreatedAt = enrollment.CreatedAt,
            UpdatedAt = enrollment.UpdatedAt
        };
    }
}
