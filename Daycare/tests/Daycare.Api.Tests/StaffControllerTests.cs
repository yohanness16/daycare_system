using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Staff;
using Daycare.Application.Features.Staff;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using Xunit;

namespace Daycare.Api.Tests;

public class StaffControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public StaffControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task CreateAndGetById_AdminRole_ReturnsCreatedAndOk()
    {
        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin);

        var request = new CreateStaffRequest
        {
            FirstName = "Sarah",
            LastName = "Connor",
            Email = $"sarah_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-4321",
            Role = StaffRole.Teacher
        };

        var postResult = await controller.Create(request, CancellationToken.None);
        var createdResult = Assert.IsType<CreatedAtActionResult>(postResult);
        var createdStaff = Assert.IsType<StaffResponse>(createdResult.Value);
        Assert.Equal("Sarah", createdStaff.FirstName);
        Assert.Equal(StaffRole.Teacher, createdStaff.Role);

        // Fetch staff by ID
        var getResult = await controller.GetById(createdStaff.Id, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(getResult);
        var fetchedStaff = Assert.IsType<StaffResponse>(okResult.Value);
        Assert.Equal(createdStaff.Id, fetchedStaff.Id);
    }

    [Fact]
    public void CreateStaff_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(StaffController).GetMethod(nameof(StaffController.Create));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void UpdateStaff_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(StaffController).GetMethod(nameof(StaffController.Update));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void DeleteStaff_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(StaffController).GetMethod(nameof(StaffController.Delete));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void DeactivateStaff_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(StaffController).GetMethod(nameof(StaffController.Deactivate));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void ReactivateStaff_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(StaffController).GetMethod(nameof(StaffController.Reactivate));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void ResetPassword_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(StaffController).GetMethod(nameof(StaffController.ResetStaffPassword));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public async Task DeactivateStaff_Success_SetsIsActiveFalse_RemovesAssignments_AndPreventsLogin()
    {
        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin);

        var createReq = new CreateStaffRequest
        {
            FirstName = "Deac",
            LastName = "Test",
            Email = $"deac_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-9999",
            Role = StaffRole.Teacher
        };

        var postResult = await controller.Create(createReq, CancellationToken.None);
        var createdStaff = Assert.IsType<StaffResponse>(Assert.IsType<CreatedAtActionResult>(postResult).Value);
        Assert.True(createdStaff.IsActive);

        // Add a classroom assignment
        var classroom = new Classroom
        {
            Id = Guid.NewGuid(),
            Name = "Room 101",
            Capacity = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _fixture.DbContext.Classrooms.Add(classroom);
        _fixture.DbContext.ClassroomStaff.Add(new ClassroomStaff
        {
            Id = Guid.NewGuid(),
            ClassroomId = classroom.Id,
            StaffId = createdStaff.Id,
            AssignedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _fixture.DbContext.SaveChangesAsync();

        using var scope = _fixture.ServiceProvider.CreateScope();
        var deactService = scope.ServiceProvider.GetRequiredService<IDeactivateStaffService>();

        // Deactivate
        var deactResult = await controller.Deactivate(createdStaff.Id, deactService, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(deactResult);
        var deactStaff = Assert.IsType<StaffResponse>(okResult.Value);
        Assert.False(deactStaff.IsActive);
        Assert.NotNull(deactStaff.DeactivatedAt);

        // Verify assignment removed
        var hasAssignments = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _fixture.DbContext.ClassroomStaff, cs => cs.StaffId == createdStaff.Id);
        Assert.False(hasAssignments);

        // Verify login fails with AccountDisabledException
        var authService = _fixture.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();
        await Assert.ThrowsAsync<Daycare.Domain.Exceptions.AccountDisabledException>(() =>
            authService.LoginAsync(new Daycare.Application.DTOs.Auth.LoginRequest { Email = createReq.Email, Password = "AnyPassword123!" }, CancellationToken.None));
    }

    [Fact]
    public async Task ReactivateStaff_Success_SetsIsActiveTrue()
    {
        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin);

        var createReq = new CreateStaffRequest
        {
            FirstName = "React",
            LastName = "Test",
            Email = $"react_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-8888",
            Role = StaffRole.Assistant
        };

        var postResult = await controller.Create(createReq, CancellationToken.None);
        var createdStaff = Assert.IsType<StaffResponse>(Assert.IsType<CreatedAtActionResult>(postResult).Value);

        using var scope = _fixture.ServiceProvider.CreateScope();
        var deactService = scope.ServiceProvider.GetRequiredService<IDeactivateStaffService>();
        var reactService = scope.ServiceProvider.GetRequiredService<IReactivateStaffService>();

        // Deactivate first
        await controller.Deactivate(createdStaff.Id, deactService, CancellationToken.None);

        // Reactivate
        var reactResult = await controller.Reactivate(createdStaff.Id, reactService, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(reactResult);
        var reactStaff = Assert.IsType<StaffResponse>(okResult.Value);
        Assert.True(reactStaff.IsActive);
        Assert.Null(reactStaff.DeactivatedAt);
    }

    [Fact]
    public async Task DeactivateStaff_CannotDeactivateSelf()
    {
        var staffId = Guid.NewGuid();
        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin, staffId: staffId);

        // Seed a staff with this ID
        var staff = new Staff
        {
            Id = staffId,
            FirstName = "Self",
            LastName = "Admin",
            Email = $"self_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-1111",
            StaffRole = StaffRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _fixture.DbContext.Staff.Add(staff);
        await _fixture.DbContext.SaveChangesAsync();

        using var scope = _fixture.ServiceProvider.CreateScope();
        var deactService = scope.ServiceProvider.GetRequiredService<IDeactivateStaffService>();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            controller.Deactivate(staffId, deactService, CancellationToken.None));
        Assert.Contains("cannot deactivate your own account", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DeactivateStaff_CannotDeactivateLastActiveAdmin()
    {
        // Clean any active admins and make soleAdmin the only active admin
        var existingAdmins = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            _fixture.DbContext.Staff.Where(s => s.StaffRole == StaffRole.Admin && s.IsActive));
        _fixture.DbContext.Staff.RemoveRange(existingAdmins);

        var soleAdmin = new Staff
        {
            Id = Guid.NewGuid(),
            FirstName = "Sole",
            LastName = "Admin",
            Email = $"sole_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-2222",
            StaffRole = StaffRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _fixture.DbContext.Staff.Add(soleAdmin);
        await _fixture.DbContext.SaveChangesAsync();

        // Calling from another caller (different staffId)
        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin, staffId: Guid.NewGuid());

        using var scope = _fixture.ServiceProvider.CreateScope();
        var deactService = scope.ServiceProvider.GetRequiredService<IDeactivateStaffService>();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            controller.Deactivate(soleAdmin.Id, deactService, CancellationToken.None));
        Assert.Contains("last active administrator", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetAllStaff_WithIsActiveFilter_FiltersCorrectly()
    {
        var controller = _fixture.CreateController<StaffController>(role: Roles.Admin);

        var s1 = new Staff
        {
            Id = Guid.NewGuid(),
            FirstName = "Active1",
            LastName = "User",
            Email = $"a1_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-3333",
            StaffRole = StaffRole.Teacher,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var s2 = new Staff
        {
            Id = Guid.NewGuid(),
            FirstName = "Inactive1",
            LastName = "User",
            Email = $"i1_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-4444",
            StaffRole = StaffRole.Teacher,
            IsActive = false,
            DeactivatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _fixture.DbContext.Staff.AddRange(s1, s2);
        await _fixture.DbContext.SaveChangesAsync();

        // Default / isActive="true"
        var activeResult = Assert.IsType<OkObjectResult>(await controller.GetAll("true", CancellationToken.None));
        var activeList = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<StaffResponse>>(activeResult.Value);
        Assert.Contains(activeList, s => s.Id == s1.Id);
        Assert.DoesNotContain(activeList, s => s.Id == s2.Id);

        // isActive="false"
        var inactiveResult = Assert.IsType<OkObjectResult>(await controller.GetAll("false", CancellationToken.None));
        var inactiveList = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<StaffResponse>>(inactiveResult.Value);
        Assert.DoesNotContain(inactiveList, s => s.Id == s1.Id);
        Assert.Contains(inactiveList, s => s.Id == s2.Id);

        // isActive="all"
        var allResult = Assert.IsType<OkObjectResult>(await controller.GetAll("all", CancellationToken.None));
        var allList = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<StaffResponse>>(allResult.Value);
        Assert.Contains(allList, s => s.Id == s1.Id);
        Assert.Contains(allList, s => s.Id == s2.Id);
    }
}
