using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Classrooms;

public interface IGetClassroomService
{
    Task<ClassroomResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class GetClassroomService : IGetClassroomService
{
    private readonly IDaycareDbContext _db;

    public GetClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ClassroomResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var classroom = await _db.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (classroom is null)
            return null;

        var activeEnrollmentCount = await _db.Enrollments
            .CountAsync(e => e.ClassroomId == id && e.Status == EnrollmentStatus.Active, cancellationToken);

        return new ClassroomResponse
        {
            Id = classroom.Id,
            Name = classroom.Name,
            Capacity = classroom.Capacity,
            CurrentEnrollmentCount = activeEnrollmentCount,
            CreatedAt = classroom.CreatedAt,
            UpdatedAt = classroom.UpdatedAt
        };
    }
}
