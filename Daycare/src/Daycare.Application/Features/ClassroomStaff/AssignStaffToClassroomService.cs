using Daycare.Application.DTOs.ClassroomStaff;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.ClassroomStaff;

public interface IAssignStaffToClassroomService
{
    Task<ClassroomStaffResponse> ExecuteAsync(AssignStaffToClassroomRequest request, CancellationToken cancellationToken = default);
}

public class AssignStaffToClassroomService : IAssignStaffToClassroomService
{
    private readonly IDaycareDbContext _db;

    public AssignStaffToClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ClassroomStaffResponse> ExecuteAsync(AssignStaffToClassroomRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ClassroomId == Guid.Empty)
            throw new ArgumentException("A valid ClassroomId is required.", nameof(request.ClassroomId));

        if (request.StaffId == Guid.Empty)
            throw new ArgumentException("A valid StaffId is required.", nameof(request.StaffId));

        var classroom = await _db.Classrooms
            .FirstOrDefaultAsync(c => c.Id == request.ClassroomId, cancellationToken);

        if (classroom is null)
            throw new KeyNotFoundException($"Classroom with ID '{request.ClassroomId}' was not found.");

        var staff = await _db.Staff
            .FirstOrDefaultAsync(s => s.Id == request.StaffId, cancellationToken);

        if (staff is null)
            throw new KeyNotFoundException($"Staff member with ID '{request.StaffId}' was not found.");

        var existingActiveAssignment = await _db.ClassroomStaff
            .FirstOrDefaultAsync(cs => cs.ClassroomId == request.ClassroomId 
                                    && cs.StaffId == request.StaffId 
                                    && cs.EndedAt == null, cancellationToken);

        if (existingActiveAssignment is not null)
            throw new InvalidOperationException($"Staff member '{staff.FirstName} {staff.LastName}' is already actively assigned to classroom '{classroom.Name}'.");

        var assignment = new Daycare.Domain.Entities.ClassroomStaff
        {
            Id = Guid.NewGuid(),
            ClassroomId = classroom.Id,
            StaffId = staff.Id,
            AssignedAt = request.AssignedAt ?? DateTime.UtcNow,
            EndedAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ClassroomStaff.Add(assignment);
        await _db.SaveChangesAsync(cancellationToken);

        return new ClassroomStaffResponse
        {
            Id = assignment.Id,
            ClassroomId = classroom.Id,
            ClassroomName = classroom.Name,
            StaffId = staff.Id,
            StaffName = $"{staff.FirstName} {staff.LastName}".Trim(),
            AssignedAt = assignment.AssignedAt,
            EndedAt = assignment.EndedAt,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt
        };
    }
}
