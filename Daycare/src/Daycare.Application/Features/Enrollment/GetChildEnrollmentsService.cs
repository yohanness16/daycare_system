using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface IGetChildEnrollmentsService
{
    Task<IReadOnlyList<EnrollmentResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default);
}

public class GetChildEnrollmentsService : IGetChildEnrollmentsService
{
    private readonly IDaycareDbContext _db;

    public GetChildEnrollmentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        if (childId == Guid.Empty)
            throw new ArgumentException("A valid childId is required.", nameof(childId));

        return await _db.Enrollments
            .AsNoTracking()
            .Include(e => e.Child)
            .Include(e => e.Classroom)
            .Where(e => e.ChildId == childId)
            .OrderByDescending(e => e.EnrollmentDate)
            .Select(e => new EnrollmentResponse
            {
                Id = e.Id,
                ChildId = e.ChildId,
                ChildName = e.Child != null ? $"{e.Child.FirstName} {e.Child.LastName}".Trim() : string.Empty,
                ClassroomId = e.ClassroomId,
                ClassroomName = e.Classroom != null ? e.Classroom.Name : string.Empty,
                Status = e.Status,
                EnrollmentDate = e.EnrollmentDate,
                EndDate = e.EndDate,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
