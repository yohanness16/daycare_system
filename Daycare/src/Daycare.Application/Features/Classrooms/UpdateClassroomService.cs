using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Classrooms;

public interface IUpdateClassroomService
{
    Task<ClassroomResponse> ExecuteAsync(Guid id, UpdateClassroomRequest request, CancellationToken cancellationToken = default);
}

public class UpdateClassroomService : IUpdateClassroomService
{
    private readonly IDaycareDbContext _db;

    public UpdateClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ClassroomResponse> ExecuteAsync(Guid id, UpdateClassroomRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Classroom name is required.", nameof(request.Name));

        if (request.Capacity <= 0)
            throw new ArgumentException("Classroom capacity must be greater than zero.", nameof(request.Capacity));

        var classroom = await _db.Classrooms
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (classroom is null)
            throw new KeyNotFoundException($"Classroom with ID '{id}' was not found.");

        var activeEnrollmentCount = await _db.Enrollments
            .CountAsync(e => e.ClassroomId == id && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (request.Capacity < activeEnrollmentCount)
        {
            throw new InvalidOperationException($"Cannot reduce capacity to {request.Capacity}. The classroom currently has {activeEnrollmentCount} active children enrolled.");
        }

        classroom.Name = request.Name.Trim();
        classroom.Capacity = request.Capacity;
        classroom.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

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
