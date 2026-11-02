using Daycare.Application.Features.Dependents;
using Daycare.Domain.Entities;
using Xunit;

namespace Daycare.Application.Tests;

public class DependentsServicesTests
{
    [Fact]
    public async Task GetGuardianDependents_ReturnsAccurateChildrenCount()
    {
        using var db = TestDbContextFactory.Create();

        var guardian = new Guardian { Id = Guid.NewGuid(), FirstName = "Bruce", LastName = "Wayne" };
        var child1 = new Child { Id = Guid.NewGuid(), FirstName = "Damian", LastName = "Wayne", GuardianId = guardian.Id };
        var child2 = new Child { Id = Guid.NewGuid(), FirstName = "Dick", LastName = "Grayson", GuardianId = guardian.Id };

        db.Guardians.Add(guardian);
        db.Children.AddRange(child1, child2);
        await db.SaveChangesAsync();

        var service = new GetGuardianDependentsService(db);
        var result = await service.ExecuteAsync(guardian.Id);

        Assert.Equal(2, result.Children);
    }

    [Fact]
    public async Task GetClassroomDependents_ReturnsAccurateCounts()
    {
        using var db = TestDbContextFactory.Create();

        var classroom = new Classroom { Id = Guid.NewGuid(), Name = "Infants", Capacity = 10 };
        var staff = new Staff { Id = Guid.NewGuid(), FirstName = "Alfred", LastName = "Pennyworth" };
        var cs = new ClassroomStaff { ClassroomId = classroom.Id, StaffId = staff.Id };

        db.Classrooms.Add(classroom);
        db.Staff.Add(staff);
        db.ClassroomStaff.Add(cs);
        await db.SaveChangesAsync();

        var service = new GetClassroomDependentsService(db);
        var result = await service.ExecuteAsync(classroom.Id);

        Assert.Equal(1, result.ActiveStaff);
        Assert.Equal(0, result.ActiveEnrollments);
    }
}
