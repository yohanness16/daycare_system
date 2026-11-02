using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Features.Enrollment;
using Daycare.Domain.Entities;
using Xunit;

namespace Daycare.Application.Tests;

public class EnrollmentServicesTests
{
    [Fact]
    public async Task EnrollChildService_CapacityExceeded_ThrowsInvalidOperationException()
    {
        using var db = TestDbContextFactory.Create();
        var classroom = new Classroom
        {
            Id = Guid.NewGuid(),
            Name = "Infant Room",
            Capacity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var child1 = new Child { Id = Guid.NewGuid(), FirstName = "Child1", LastName = "One" };
        var child2 = new Child { Id = Guid.NewGuid(), FirstName = "Child2", LastName = "Two" };

        db.Classrooms.Add(classroom);
        db.Children.AddRange(child1, child2);
        db.Enrollments.Add(new Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child1.Id,
            ClassroomId = classroom.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = new EnrollChildService(db);
        var request = new EnrollChildRequest
        {
            ChildId = child2.Id,
            ClassroomId = classroom.Id
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => service.ExecuteAsync(request));
        Assert.Contains("full capacity", exception.Message);
    }

    [Fact]
    public async Task TransferChildClassroomService_ValidRequest_EndsOldAndEnrollsInNew()
    {
        using var db = TestDbContextFactory.Create();
        var room1 = new Classroom { Id = Guid.NewGuid(), Name = "Toddler Room", Capacity = 5 };
        var room2 = new Classroom { Id = Guid.NewGuid(), Name = "Preschool Room", Capacity = 5 };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Leo", LastName = "Miller" };

        db.Classrooms.AddRange(room1, room2);
        db.Children.Add(child);
        var activeEnrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = room1.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = DateTime.UtcNow.AddMonths(-3)
        };
        db.Enrollments.Add(activeEnrollment);
        await db.SaveChangesAsync();

        var service = new TransferChildClassroomService(db);
        var transferRequest = new TransferChildClassroomRequest
        {
            ChildId = child.Id,
            NewClassroomId = room2.Id
        };

        var result = await service.ExecuteAsync(transferRequest);

        Assert.NotNull(result);
        Assert.Equal(room2.Id, result.ClassroomId);
        Assert.Equal(EnrollmentStatus.Active, result.Status);

        // Verify old enrollment is completed with EndDate
        var old = await db.Enrollments.FindAsync(activeEnrollment.Id);
        Assert.Equal(EnrollmentStatus.Completed, old!.Status);
        Assert.NotNull(old.EndDate);
    }

    [Fact]
    public async Task EndEnrollmentService_ValidId_SetsCompletedAndEndDate()
    {
        using var db = TestDbContextFactory.Create();
        var room = new Classroom { Id = Guid.NewGuid(), Name = "Room A", Capacity = 10 };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Sam", LastName = "Jones" };
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = room.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = DateTime.UtcNow
        };

        db.Classrooms.Add(room);
        db.Children.Add(child);
        db.Enrollments.Add(enrollment);
        await db.SaveChangesAsync();

        var service = new EndEnrollmentService(db);
        var result = await service.ExecuteAsync(enrollment.Id);

        Assert.Equal(EnrollmentStatus.Completed, result.Status);
        Assert.NotNull(result.EndDate);
    }
}
