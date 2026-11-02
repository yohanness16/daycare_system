using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;

namespace Daycare.Application.Features.Classrooms;

public interface ICreateClassroomService
{
    Task<ClassroomResponse> ExecuteAsync(CreateClassroomRequest request, CancellationToken cancellationToken = default);
}

public class CreateClassroomService : ICreateClassroomService
{
    private readonly IDaycareDbContext _db;

    public CreateClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ClassroomResponse> ExecuteAsync(CreateClassroomRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Classroom name is required.", nameof(request.Name));

        if (request.Capacity <= 0)
            throw new ArgumentException("Classroom capacity must be greater than zero.", nameof(request.Capacity));

        var classroom = new Classroom
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Capacity = request.Capacity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Classrooms.Add(classroom);
        await _db.SaveChangesAsync(cancellationToken);

        return new ClassroomResponse
        {
            Id = classroom.Id,
            Name = classroom.Name,
            Capacity = classroom.Capacity,
            CurrentEnrollmentCount = 0,
            CreatedAt = classroom.CreatedAt,
            UpdatedAt = classroom.UpdatedAt
        };
    }
}
