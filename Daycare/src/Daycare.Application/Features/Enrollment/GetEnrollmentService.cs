using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface IGetEnrollmentService
{
    Task<EnrollmentResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class GetEnrollmentService : IGetEnrollmentService
{
    private readonly IDaycareDbContext _db;

    public GetEnrollmentService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<EnrollmentResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var enrollment = await _db.Enrollments
            .AsNoTracking()
            .Include(e => e.Child)
            .Include(e => e.Classroom)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (enrollment is null)
            return null;

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
