using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Children;
using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.DTOs.Meals;
using Daycare.Application.DTOs.Staff;
using Daycare.Application.Features.Children;
using Daycare.Application.Features.Classrooms;
using Daycare.Application.Features.Enrollment;
using Daycare.Application.Features.Guardians;
using Daycare.Application.Features.Staff;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Daycare.Api.Tests;

public class MealsAndActivitiesControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public MealsAndActivitiesControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Meals_RecordAndGetByChild_Succeeds()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Grace",
            LastName = "Hopper",
            Email = $"grace_{Guid.NewGuid():N}@example.com",
            Phone = "555-4433",
            Address = "10 Computing Way"
        });

        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "Ada",
            LastName = "Hopper",
            DateOfBirth = new DateOnly(2023, 3, 14),
            Gender = "Female",
            GuardianId = guardian.Id
        });

        var staffService = scope.ServiceProvider.GetRequiredService<ICreateStaffService>();
        var staff = await staffService.ExecuteAsync(new CreateStaffRequest
        {
            FirstName = "Chef",
            LastName = "Gordon",
            Email = $"chef_{Guid.NewGuid():N}@daycare.local",
            Role = StaffRole.Feeder
        });

        var classroomService = scope.ServiceProvider.GetRequiredService<ICreateClassroomService>();
        var classroom = await classroomService.ExecuteAsync(new CreateClassroomRequest
        {
            Name = "Toddler Room",
            Capacity = 10
        });

        var enrollService = scope.ServiceProvider.GetRequiredService<IEnrollChildService>();
        await enrollService.ExecuteAsync(new EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        var mealsController = _fixture.CreateController<MealsController>(role: Roles.Staff);
        var mealRequest = new RecordMealRequest
        {
            ChildId = child.Id,
            StaffId = staff.Id,
            Type = MealType.Lunch,
            Food = "Vegetable soup and apple slices",
            MealTime = DateTime.UtcNow,
            Status = MealStatus.Eaten,
            Notes = "Ate well"
        };

        var postResult = await mealsController.Record(mealRequest, CancellationToken.None);
        var created = Assert.IsType<ObjectResult>(postResult);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        var meal = Assert.IsType<MealResponse>(created.Value);
        Assert.Equal(child.Id, meal.ChildId);
        Assert.Equal(MealType.Lunch, meal.Type);

        var getResult = await mealsController.GetByChild(child.Id, CancellationToken.None);
        var okGet = Assert.IsType<OkObjectResult>(getResult);
        var mealsList = Assert.IsAssignableFrom<IReadOnlyList<MealResponse>>(okGet.Value);
        Assert.Contains(mealsList, m => m.Id == meal.Id);
    }

    [Fact]
    public async Task Activities_RecordAndGetByChild_Succeeds()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Alan",
            LastName = "Turing",
            Email = $"alan_{Guid.NewGuid():N}@example.com",
            Phone = "555-8899",
            Address = "42 Enigma Lane"
        });

        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "Chris",
            LastName = "Turing",
            DateOfBirth = new DateOnly(2022, 11, 5),
            Gender = "Male",
            GuardianId = guardian.Id
        });

        var staffService = scope.ServiceProvider.GetRequiredService<ICreateStaffService>();
        var staff = await staffService.ExecuteAsync(new CreateStaffRequest
        {
            FirstName = "Teacher",
            LastName = "Tim",
            Email = $"tim_{Guid.NewGuid():N}@daycare.local",
            Role = StaffRole.Teacher
        });

        var classroomService = scope.ServiceProvider.GetRequiredService<ICreateClassroomService>();
        var classroom = await classroomService.ExecuteAsync(new CreateClassroomRequest
        {
            Name = "Preschool Room",
            Capacity = 12
        });

        var enrollService = scope.ServiceProvider.GetRequiredService<IEnrollChildService>();
        await enrollService.ExecuteAsync(new EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        var activitiesController = _fixture.CreateController<DailyActivitiesController>(role: Roles.Staff);
        var activityRequest = new RecordActivityRequest
        {
            ChildId = child.Id,
            ActivityType = ActivityType.Play,
            StartTime = DateTime.UtcNow.AddHours(-1),
            EndTime = DateTime.UtcNow,
            ActivityDescription = "Building block towers",
            RecordedById = staff.Id,
            Note = "Collaborated with peers"
        };

        var postResult = await activitiesController.Record(activityRequest, CancellationToken.None);
        var created = Assert.IsType<ObjectResult>(postResult);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        var activity = Assert.IsType<DailyActivityResponse>(created.Value);
        Assert.Equal(child.Id, activity.ChildId);
        Assert.Equal(ActivityType.Play, activity.ActivityType);

        var getResult = await activitiesController.GetByChild(child.Id, CancellationToken.None);
        var okGet = Assert.IsType<OkObjectResult>(getResult);
        var activityList = Assert.IsAssignableFrom<IReadOnlyList<DailyActivityResponse>>(okGet.Value);
        Assert.Contains(activityList, a => a.Id == activity.Id);
    }
}
