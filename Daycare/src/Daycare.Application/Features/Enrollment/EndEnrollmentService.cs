using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface IEndEnrollmentService
{
    Task<EnrollmentResponse> ExecuteAsync(Guid enrollmentId, CancellationToken cancellationToken = default);
}

public class EndEnrollmentService : IEndEnrollmentService
{
    private readonly IDaycareDbContext _db;

    public EndEnrollmentService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<EnrollmentResponse> ExecuteAsync(Guid enrollmentId, CancellationToken cancellationToken = default)
    {
        var enrollment = await _db.Enrollments
            .Include(e => e.Child)
            .Include(e => e.Classroom)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, cancellationToken);

        if (enrollment is null)
            throw new KeyNotFoundException($"Enrollment with ID '{enrollmentId}' was not found.");

        if (enrollment.Status != EnrollmentStatus.Active)
            throw new InvalidOperationException($"Enrollment is already marked as {enrollment.Status}.");

        enrollment.Status = EnrollmentStatus.Completed;
        enrollment.EndDate = DateTime.UtcNow;
        enrollment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new EnrollmentResponse
        {
            Id = enrollment.Id,
            ChildId = enrollment.ChildId,
            ChildName = enrollment.Child != null
                ? $"{enrollment.Child.FirstName} {enrollment.Child.LastName}".Trim()
                : string.Empty,
            ClassroomId = enrollment.ClassroomId,
            ClassroomName = enrollment.Classroom != null
                ? enrollment.Classroom.Name
                : string.Empty,
            Status = enrollment.Status,
            EnrollmentDate = enrollment.EnrollmentDate,
            EndDate = enrollment.EndDate,
            CreatedAt = enrollment.CreatedAt,
            UpdatedAt = enrollment.UpdatedAt
        };
    }
}
