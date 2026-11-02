using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Enrollment;

public interface ITransferChildClassroomService
{
    Task<EnrollmentResponse> ExecuteAsync(TransferChildClassroomRequest request, CancellationToken cancellationToken = default);
}

public class TransferChildClassroomService : ITransferChildClassroomService
{
    private readonly IDaycareDbContext _db;

    public TransferChildClassroomService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<EnrollmentResponse> ExecuteAsync(TransferChildClassroomRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ChildId == Guid.Empty)
            throw new ArgumentException("A valid ChildId is required.", nameof(request.ChildId));

        if (request.NewClassroomId == Guid.Empty)
            throw new ArgumentException("A valid NewClassroomId is required.", nameof(request.NewClassroomId));

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        var currentActiveEnrollment = await _db.Enrollments
            .Include(e => e.Classroom)
            .FirstOrDefaultAsync(e => e.ChildId == request.ChildId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (currentActiveEnrollment is null)
            throw new InvalidOperationException($"Child '{child.FirstName} {child.LastName}' does not have an active enrollment to transfer from.");

        if (currentActiveEnrollment.ClassroomId == request.NewClassroomId)
            throw new InvalidOperationException($"Child is already enrolled in this classroom ('{currentActiveEnrollment.Classroom?.Name}').");

        var newClassroom = await _db.Classrooms
            .FirstOrDefaultAsync(c => c.Id == request.NewClassroomId, cancellationToken);

        if (newClassroom is null)
            throw new KeyNotFoundException($"Classroom with ID '{request.NewClassroomId}' was not found.");

        var activeInNewCount = await _db.Enrollments
            .CountAsync(e => e.ClassroomId == request.NewClassroomId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (activeInNewCount >= newClassroom.Capacity)
            throw new InvalidOperationException($"Target classroom '{newClassroom.Name}' is at full capacity ({newClassroom.Capacity} max).");

        var transferDate = request.TransferDate ?? DateTime.UtcNow;

        // End current enrollment
        currentActiveEnrollment.Status = EnrollmentStatus.Completed;
        currentActiveEnrollment.EndDate = transferDate;
        currentActiveEnrollment.UpdatedAt = DateTime.UtcNow;

        // Create new active enrollment
        var newEnrollment = new Daycare.Domain.Entities.Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = newClassroom.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = transferDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Enrollments.Add(newEnrollment);
        await _db.SaveChangesAsync(cancellationToken);

        return new EnrollmentResponse
        {
            Id = newEnrollment.Id,
            ChildId = child.Id,
            ChildName = $"{child.FirstName} {child.LastName}".Trim(),
            ClassroomId = newClassroom.Id,
            ClassroomName = newClassroom.Name,
            Status = newEnrollment.Status,
            EnrollmentDate = newEnrollment.EnrollmentDate,
            EndDate = newEnrollment.EndDate,
            CreatedAt = newEnrollment.CreatedAt,
            UpdatedAt = newEnrollment.UpdatedAt
        };
    }
}
