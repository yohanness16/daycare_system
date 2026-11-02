using Daycare.Application.DTOs.ClassroomStaff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.ClassroomStaff;

public interface IRemoveStaffFromClassroomService
{
    Task<ClassroomStaffResponse> ExecuteAsync(Guid assignmentId, CancellationToken cancellationToken = default);
}

public class RemoveStaffFromClassroomService : IRemoveStaffFromClassroomService
{
    private readonly IDaycareDbContext _db;

    public RemoveStaffFromClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ClassroomStaffResponse> ExecuteAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        if (assignmentId == Guid.Empty)
            throw new ArgumentException("A valid assignment ID is required.", nameof(assignmentId));

        var assignment = await _db.ClassroomStaff
            .Include(cs => cs.Classroom)
            .Include(cs => cs.Staff)
            .FirstOrDefaultAsync(cs => cs.Id == assignmentId, cancellationToken);

        if (assignment is null)
            throw new KeyNotFoundException($"Classroom staff assignment with ID '{assignmentId}' was not found.");

        if (assignment.EndedAt != null)
            throw new InvalidOperationException("This classroom staff assignment has already been ended.");

        assignment.EndedAt = DateTime.UtcNow;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new ClassroomStaffResponse
        {
            Id = assignment.Id,
            ClassroomId = assignment.ClassroomId,
            ClassroomName = assignment.Classroom?.Name ?? string.Empty,
            StaffId = assignment.StaffId,
            StaffName = assignment.Staff != null ? $"{assignment.Staff.FirstName} {assignment.Staff.LastName}".Trim() : string.Empty,
            AssignedAt = assignment.AssignedAt,
            EndedAt = assignment.EndedAt,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt
        };
    }
}
