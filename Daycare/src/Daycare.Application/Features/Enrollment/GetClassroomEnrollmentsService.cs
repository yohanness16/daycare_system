using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface IGetClassroomEnrollmentsService
{
    Task<IReadOnlyList<EnrollmentResponse>> ExecuteAsync(Guid classroomId, bool activeOnly = true, CancellationToken cancellationToken = default);
}

public class GetClassroomEnrollmentsService : IGetClassroomEnrollmentsService
{
    private readonly IDaycareDbContext _db;

    public GetClassroomEnrollmentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> ExecuteAsync(Guid classroomId, bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        if (classroomId == Guid.Empty)
            throw new ArgumentException("A valid classroomId is required.", nameof(classroomId));

        var query = _db.Enrollments
            .AsNoTracking()
            .Include(e => e.Child)
            .Include(e => e.Classroom)
            .Where(e => e.ClassroomId == classroomId);

        if (activeOnly)
        {
            query = query.Where(e => e.Status == EnrollmentStatus.Active);
        }

        return await query
            .OrderBy(e => e.Child != null ? e.Child.LastName : string.Empty)
            .ThenBy(e => e.Child != null ? e.Child.FirstName : string.Empty)
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
