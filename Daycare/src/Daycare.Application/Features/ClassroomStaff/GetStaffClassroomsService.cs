using Daycare.Application.DTOs.ClassroomStaff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.ClassroomStaff;

public interface IGetStaffClassroomsService
{
    Task<IReadOnlyList<ClassroomStaffResponse>> ExecuteAsync(Guid staffId, bool activeOnly = true, CancellationToken cancellationToken = default);
}

public class GetStaffClassroomsService : IGetStaffClassroomsService
{
    private readonly IDaycareDbContext _db;

    public GetStaffClassroomsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<ClassroomStaffResponse>> ExecuteAsync(Guid staffId, bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        if (staffId == Guid.Empty)
            throw new ArgumentException("A valid staffId is required.", nameof(staffId));

        var query = _db.ClassroomStaff
            .AsNoTracking()
            .Include(cs => cs.Classroom)
            .Include(cs => cs.Staff)
            .Where(cs => cs.StaffId == staffId);

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
