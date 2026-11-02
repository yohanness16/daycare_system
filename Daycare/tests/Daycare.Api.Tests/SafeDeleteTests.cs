using Daycare.Api.Controllers;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Daycare.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Daycare.Api.Tests;

public class SafeDeleteTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public SafeDeleteTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task DeleteGuardian_WithChildren_ThrowsHasDependentsException()
    {
        var guardian = new Guardian { Id = Guid.NewGuid(), FirstName = "Bruce", LastName = "Wayne", Email = $"bruce_{Guid.NewGuid():N}@wayne.com" };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Damian", LastName = "Wayne", GuardianId = guardian.Id };

        _fixture.DbContext.Guardians.Add(guardian);
        _fixture.DbContext.Children.Add(child);
        await _fixture.DbContext.SaveChangesAsync();

        var controller = _fixture.CreateController<GuardiansController>(role: Roles.Admin);

        var ex = await Assert.ThrowsAsync<HasDependentsException>(() =>
            controller.Delete(guardian.Id, CancellationToken.None));

        Assert.Equal("HAS_DEPENDENTS", ex.Code);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteClassroom_WithAssignedStaff_ThrowsHasDependentsException()
    {
        var classroom = new Classroom { Id = Guid.NewGuid(), Name = $"Room_{Guid.NewGuid():N}", Capacity = 15 };
        var staff = new Staff { Id = Guid.NewGuid(), FirstName = "Lucius", LastName = "Fox", Email = $"fox_{Guid.NewGuid():N}@wayne.com" };
        var cs = new ClassroomStaff { ClassroomId = classroom.Id, StaffId = staff.Id };

        _fixture.DbContext.Classrooms.Add(classroom);
        _fixture.DbContext.Staff.Add(staff);
        _fixture.DbContext.ClassroomStaff.Add(cs);
        await _fixture.DbContext.SaveChangesAsync();

        var controller = _fixture.CreateController<ClassroomsController>(role: Roles.Admin);

        var ex = await Assert.ThrowsAsync<HasDependentsException>(() =>
            controller.Delete(classroom.Id, CancellationToken.None));

        Assert.Equal("HAS_DEPENDENTS", ex.Code);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteStaff_WithMealRecords_ThrowsHasDependentsException()
    {
        var guardian = new Guardian { Id = Guid.NewGuid(), FirstName = "Thomas", LastName = "Wayne", Email = $"thomas_{Guid.NewGuid():N}@wayne.com" };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Bruce", LastName = "Wayne", GuardianId = guardian.Id };
        var staff = new Staff { Id = Guid.NewGuid(), FirstName = "Alfred", LastName = "Pennyworth", Email = $"alfred_{Guid.NewGuid():N}@wayne.com" };
        var meal = new Meal
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            StaffId = staff.Id,
            MealTime = DateTime.UtcNow,
            Type = MealType.Breakfast,
            Food = "Pancakes"
        };

        _fixture.DbContext.Guardians.Add(guardian);
        _fixture.DbContext.Children.Add(child);
        _fixture.DbContext.Staff.Add(staff);
        _fixture.DbContext.Meals.Add(meal);
        await _fixture.DbContext.SaveChangesAsync();

        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin);

        var ex = await Assert.ThrowsAsync<HasDependentsException>(() =>
            controller.Delete(staff.Id, CancellationToken.None));

        Assert.Equal("HAS_DEPENDENTS", ex.Code);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteChild_WithAttendanceRecords_ThrowsHasDependentsException()
    {
        var guardian = new Guardian { Id = Guid.NewGuid(), FirstName = "Martha", LastName = "Wayne", Email = $"martha_{Guid.NewGuid():N}@wayne.com" };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "ThomasJr", LastName = "Wayne", GuardianId = guardian.Id };
        var attendance = new Attendance
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            IsPresent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _fixture.DbContext.Guardians.Add(guardian);
        _fixture.DbContext.Children.Add(child);
        _fixture.DbContext.Attendances.Add(attendance);
        await _fixture.DbContext.SaveChangesAsync();

        var controller = _fixture.CreateController<ChildrenController>(role: Roles.Admin);

        var ex = await Assert.ThrowsAsync<HasDependentsException>(() =>
            controller.Delete(child.Id, CancellationToken.None));

        Assert.Equal("HAS_DEPENDENTS", ex.Code);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task PreCheckDependentsEndpoints_ReturnAccurateData()
    {
        var guardian = new Guardian { Id = Guid.NewGuid(), FirstName = "Selina", LastName = "Kyle", Email = $"selina_{Guid.NewGuid():N}@gotham.com" };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Helena", LastName = "Wayne", GuardianId = guardian.Id };

        _fixture.DbContext.Guardians.Add(guardian);
        _fixture.DbContext.Children.Add(child);
        await _fixture.DbContext.SaveChangesAsync();

        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianDepService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Dependents.IGetGuardianDependentsService>();
        var childDepService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Dependents.IGetChildDependentsService>();

        var guardianController = _fixture.CreateController<GuardiansController>(role: Roles.Admin);
        var guardianResult = await guardianController.GetDependents(guardian.Id, guardianDepService, CancellationToken.None);
        var okGuardian = Assert.IsType<OkObjectResult>(guardianResult);
        var guardianDeps = Assert.IsType<Daycare.Application.DTOs.Dependents.GuardianDependentsResponse>(okGuardian.Value);
        Assert.Equal(1, guardianDeps.Children);

        var childrenController = _fixture.CreateController<ChildrenController>(role: Roles.Admin);
        var childResult = await childrenController.GetDependents(child.Id, childDepService, CancellationToken.None);
        var okChild = Assert.IsType<OkObjectResult>(childResult);
        var childDeps = Assert.IsType<Daycare.Application.DTOs.Dependents.ChildDependentsResponse>(okChild.Value);
        Assert.Equal(0, childDeps.Enrollments);
        Assert.Equal(0, childDeps.Attendances);
    }
}
