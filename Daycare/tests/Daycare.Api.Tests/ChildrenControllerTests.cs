using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Children;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Features.Children;
using Daycare.Application.Features.Guardians;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using Xunit;

namespace Daycare.Api.Tests;

public class ChildrenControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public ChildrenControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task RegisterAndGetById_ValidChild_ReturnsCreatedAndOk()
    {
        // 1. Create a guardian first
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Mary",
            LastName = "Watson",
            Email = $"mary_{Guid.NewGuid():N}@example.com",
            Phone = "555-1234",
            Address = "742 Evergreen Terrace"
        });

        // 2. Register Child via Controller
        var controller = _fixture.CreateController<ChildrenController>(role: Roles.Staff);
        var request = new RegisterChildRequest
        {
            FirstName = "Leo",
            LastName = "Watson",
            DateOfBirth = new DateOnly(2022, 5, 20),
            Gender = "Male",
            GuardianId = guardian.Id
        };

        var postResult = await controller.Register(request, CancellationToken.None);
        var createdResult = Assert.IsType<CreatedAtActionResult>(postResult);
        var child = Assert.IsType<ChildResponse>(createdResult.Value);
        Assert.Equal("Leo", child.FirstName);
        Assert.Equal("Watson", child.LastName);

        // 3. Get By Id via Controller
        var getResult = await controller.GetById(child.Id, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(getResult);
        var fetchedChild = Assert.IsType<ChildResponse>(okResult.Value);
        Assert.Equal(child.Id, fetchedChild.Id);
    }

    [Fact]
    public async Task GetById_NonExistentChild_ReturnsNotFound()
    {
        var controller = _fixture.CreateController<ChildrenController>(role: Roles.Staff);
        var result = await controller.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_ReturnsListOfChildren()
    {
        var controller = _fixture.CreateController<ChildrenController>(role: Roles.Staff);
        var result = await controller.GetAll(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IReadOnlyList<ChildResponse>>(okResult.Value);
        Assert.NotNull(list);
    }

    [Fact]
    public void Delete_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(ChildrenController).GetMethod(nameof(ChildrenController.Delete));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void Controller_RequiresAuthentication_EnforcedByAuthorizeAttribute()
    {
        var attr = typeof(ChildrenController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
    }

    [Fact]
    public async Task GetDailyHistory_ReturnsAttendanceMealsAndActivitiesForDate()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Sarah",
            LastName = "Connor",
            Email = $"sarah_{Guid.NewGuid():N}@example.com",
            Phone = "555-8899",
            Address = "1 Cyberdyne Way"
        });

        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "John",
            LastName = "Connor",
            DateOfBirth = new DateOnly(2021, 2, 28),
            Gender = "Male",
            GuardianId = guardian.Id
        });

        var staffService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Staff.ICreateStaffService>();
        var staff = await staffService.ExecuteAsync(new Daycare.Application.DTOs.Staff.CreateStaffRequest
        {
            FirstName = "Kyle",
            LastName = "Reese",
            Email = $"kyle_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-0011",
            Role = Daycare.Domain.Entities.StaffRole.Teacher
        });

        var classroomService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Classrooms.ICreateClassroomService>();
        var classroom = await classroomService.ExecuteAsync(new Daycare.Application.DTOs.Classrooms.CreateClassroomRequest
        {
            Name = "Toddler Room",
            Capacity = 20
        });

        var enrollService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Enrollment.IEnrollChildService>();
        await enrollService.ExecuteAsync(new Daycare.Application.DTOs.Enrollment.EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        var targetDate = new DateOnly(2026, 10, 8);

        // Record Attendance
        var attendanceService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Attendance.IRecordAttendanceService>();
        await attendanceService.ExecuteAsync(new Daycare.Application.DTOs.Attendance.RecordAttendanceRequest
        {
            ChildId = child.Id,
            ArrivalTime = DateTime.SpecifyKind(targetDate.ToDateTime(new TimeOnly(8, 30)), DateTimeKind.Utc),
            RecordedById = staff.Id,
            Note = "Arrived cheerfully"
        });

        // Record Meal
        var mealService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Meals.IRecordMealService>();
        var mealTime = DateTime.SpecifyKind(targetDate.ToDateTime(new TimeOnly(12, 0)), DateTimeKind.Utc);
        await mealService.ExecuteAsync(new Daycare.Application.DTOs.Meals.RecordMealRequest
        {
            ChildId = child.Id,
            StaffId = staff.Id,
            Type = Daycare.Domain.Entities.MealType.Lunch,
            Food = "Vegetable soup and crackers",
            MealTime = mealTime,
            Status = Daycare.Domain.Entities.MealStatus.Eaten,
            Notes = "Ate all soup"
        });

        // Record Activity
        var activityService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.DailyActivities.IRecordActivityService>();
        var activityStart = DateTime.SpecifyKind(targetDate.ToDateTime(new TimeOnly(13, 0)), DateTimeKind.Utc);
        var activityEnd = DateTime.SpecifyKind(targetDate.ToDateTime(new TimeOnly(14, 0)), DateTimeKind.Utc);
        await activityService.ExecuteAsync(new Daycare.Application.DTOs.DailyActivities.RecordActivityRequest
        {
            ChildId = child.Id,
            RecordedById = staff.Id,
            ActivityType = Daycare.Domain.Entities.ActivityType.Nap,
            StartTime = activityStart,
            EndTime = activityEnd,
            ActivityDescription = "Afternoon nap",
            Note = "Slept quietly for 1 hour"
        });

        // Query daily history via controller
        var controller = _fixture.CreateController<ChildrenController>(role: Roles.Staff);
        var actionResult = await controller.GetDailyHistory(child.Id, targetDate, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var history = Assert.IsType<ChildDailyHistoryResponse>(okResult.Value);

        Assert.Equal(child.Id, history.ChildId);
        Assert.Equal("John Connor", history.ChildName);
        Assert.Equal(targetDate, history.Date);

        Assert.NotNull(history.Attendance);
        Assert.True(history.Attendance.IsPresent);
        Assert.Equal("Arrived cheerfully", history.Attendance.Note);

        Assert.Single(history.Meals);
        Assert.Equal("Vegetable soup and crackers", history.Meals[0].Food);

        Assert.Single(history.Activities);
        Assert.Equal(Daycare.Domain.Entities.ActivityType.Nap, history.Activities[0].ActivityType);
        Assert.Equal("Afternoon nap", history.Activities[0].ActivityDescription);
    }
}
