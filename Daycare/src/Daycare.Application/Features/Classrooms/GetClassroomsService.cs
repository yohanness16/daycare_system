using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Classrooms;

public interface IGetClassroomsService
{
    Task<IReadOnlyList<ClassroomResponse>> ExecuteAsync(CancellationToken cancellationToken = default);
}

public class GetClassroomsService : IGetClassroomsService
{
    private readonly IDaycareDbContext _db;

    public GetClassroomsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<ClassroomResponse>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var classrooms = await _db.Classrooms
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var enrollmentCounts = await _db.Enrollments
            .AsNoTracking()
            .Where(e => e.Status == EnrollmentStatus.Active)
            .GroupBy(e => e.ClassroomId)
            .Select(g => new { ClassroomId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ClassroomId, x => x.Count, cancellationToken);

        return classrooms.Select(c => new ClassroomResponse
        {
            Id = c.Id,
            Name = c.Name,
            Capacity = c.Capacity,
            CurrentEnrollmentCount = enrollmentCounts.GetValueOrDefault(c.Id, 0),
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        }).ToList();
    }
}
