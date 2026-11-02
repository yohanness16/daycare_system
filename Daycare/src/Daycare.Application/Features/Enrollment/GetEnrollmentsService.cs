using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface IGetEnrollmentsService
{
    Task<IReadOnlyList<EnrollmentResponse>> ExecuteAsync(
        Guid? classroomId = null,
        Guid? childId = null,
        EnrollmentStatus? status = null,
        CancellationToken cancellationToken = default);
}

public class GetEnrollmentsService : IGetEnrollmentsService
{
    private readonly IDaycareDbContext _db;

    public GetEnrollmentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> ExecuteAsync(
        Guid? classroomId = null,
        Guid? childId = null,
        EnrollmentStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Enrollments
            .AsNoTracking()
            .Include(e => e.Child)
            .Include(e => e.Classroom)
            .AsQueryable();

        if (classroomId.HasValue && classroomId.Value != Guid.Empty)
        {
            query = query.Where(e => e.ClassroomId == classroomId.Value);
        }

        if (childId.HasValue && childId.Value != Guid.Empty)
        {
            query = query.Where(e => e.ChildId == childId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(e => e.Status == status.Value);
        }

        return await query
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
