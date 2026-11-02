using Daycare.Application.DTOs.ClassroomStaff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.ClassroomStaff;

public interface IGetClassroomStaffService
{
    Task<IReadOnlyList<ClassroomStaffResponse>> ExecuteAsync(Guid classroomId, bool activeOnly = true, CancellationToken cancellationToken = default);
}

public class GetClassroomStaffService : IGetClassroomStaffService
{
    private readonly IDaycareDbContext _db;

    public GetClassroomStaffService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<ClassroomStaffResponse>> ExecuteAsync(Guid classroomId, bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        if (classroomId == Guid.Empty)
            throw new ArgumentException("A valid classroomId is required.", nameof(classroomId));

        var query = _db.ClassroomStaff
            .AsNoTracking()
            .Include(cs => cs.Classroom)
            .Include(cs => cs.Staff)
            .Where(cs => cs.ClassroomId == classroomId);

        if (activeOnly)
        {
            query = query.Where(cs => cs.EndedAt == null);
        }

        return await query
            .OrderByDescending(cs => cs.AssignedAt)
            .Select(cs => new ClassroomStaffResponse
            {
                Id = cs.Id,
                ClassroomId = cs.ClassroomId,
                ClassroomName = cs.Classroom != null ? cs.Classroom.Name : string.Empty,
                StaffId = cs.StaffId,
                StaffName = cs.Staff != null ? $"{cs.Staff.FirstName} {cs.Staff.LastName}".Trim() : string.Empty,
                AssignedAt = cs.AssignedAt,
                EndedAt = cs.EndedAt,
                CreatedAt = cs.CreatedAt,
                UpdatedAt = cs.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
