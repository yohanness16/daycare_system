using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Classrooms;

public interface IDeleteClassroomService
{
    Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class DeleteClassroomService : IDeleteClassroomService
{
    private readonly IDaycareDbContext _db;

    public DeleteClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var classroom = await _db.Classrooms
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (classroom is null)
            throw new KeyNotFoundException($"Classroom with ID '{id}' was not found.");

        var activeEnrollments = await _db.Enrollments
            .CountAsync(e => e.ClassroomId == id && e.Status == EnrollmentStatus.Active, cancellationToken);
        var activeStaff = await _db.ClassroomStaff
            .CountAsync(cs => cs.ClassroomId == id, cancellationToken);

        if (activeEnrollments > 0 || activeStaff > 0)
        {
            throw new Daycare.Domain.Exceptions.HasDependentsException(
                $"Cannot delete classroom '{classroom.Name}' because it has active enrollments or assigned staff.",
                new Dictionary<string, int> { { "activeEnrollments", activeEnrollments }, { "activeStaff", activeStaff } });
        }


        _db.Classrooms.Remove(classroom);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
