using System.Text;
using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.Children;
using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.DTOs.Meals;
using Daycare.Application.DTOs.Media;
using Daycare.Application.DTOs.Reports;
using Daycare.Application.DTOs.Staff;
using Daycare.Application.Features.Attendance;
using Daycare.Application.Features.Children;
using Daycare.Application.Features.Classrooms;
using Daycare.Application.Features.DailyActivities;
using Daycare.Application.Features.Enrollment;
using Daycare.Application.Features.Guardians;
using Daycare.Application.Features.Meals;
using Daycare.Application.Features.Reports;
using Daycare.Application.Features.Staff;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Daycare.Api.Tests;

public class MediaAndReportsControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public MediaAndReportsControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task MediaUpload_ValidFile_ReturnsOkWithMetadata()
    {
        var env = _fixture.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var controller = new MediaController(env);

        var content = "dummy image content";
        var fileName = "test_image.png";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        var formFile = new FormFile(stream, 0, stream.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        var result = await controller.Upload(formFile, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<MediaUploadResponse>(okResult.Value);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Equal(fileName, response.FileName);
        Assert.Equal("image/png", response.ContentType);
        Assert.StartsWith("/uploads/", response.Url);
        Assert.EndsWith(".png", response.Url);
    }

    [Fact]
    public async Task MediaUpload_DisallowedExtension_ReturnsBadRequest()
    {
        var env = _fixture.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var controller = new MediaController(env);

        var content = "binary exe";
        var fileName = "virus.exe";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        var formFile = new FormFile(stream, 0, stream.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream"
        };

        var result = await controller.Upload(formFile, CancellationToken.None);
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task MediaUpload_EmptyFile_ReturnsBadRequest()
    {
        var env = _fixture.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var controller = new MediaController(env);

        var stream = new MemoryStream();
        var formFile = new FormFile(stream, 0, 0, "file", "empty.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        var result = await controller.Upload(formFile, CancellationToken.None);
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task Reports_DailyReport_ReturnsConsolidatedSummary()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var staffService = scope.ServiceProvider.GetRequiredService<ICreateStaffService>();
        var classroomService = scope.ServiceProvider.GetRequiredService<ICreateClassroomService>();
        var enrollService = scope.ServiceProvider.GetRequiredService<IEnrollChildService>();
        var attendanceService = scope.ServiceProvider.GetRequiredService<IRecordAttendanceService>();
        var mealService = scope.ServiceProvider.GetRequiredService<IRecordMealService>();
        var activityService = scope.ServiceProvider.GetRequiredService<IRecordActivityService>();
        var reportService = scope.ServiceProvider.GetRequiredService<IGetDailyReportService>();

        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Marie",
            LastName = "Curie",
            Email = $"curie_{Guid.NewGuid():N}@example.com",
            Phone = "555-8888",
            Address = "Science Way"
        });

        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "Irene",
            LastName = "Curie",
            DateOfBirth = new DateOnly(2022, 9, 12),
            Gender = "Female",
            GuardianId = guardian.Id
        });

        var classroom = await classroomService.ExecuteAsync(new CreateClassroomRequest
        {
            Name = $"Room-{Guid.NewGuid():N}",
            Capacity = 10
        });

        await enrollService.ExecuteAsync(new EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        var staff = await staffService.ExecuteAsync(new CreateStaffRequest
        {
            FirstName = "Pierre",
            LastName = "Curie",
            Email = $"pierre_{Guid.NewGuid():N}@example.com",
            Phone = "555-9999",
            Address = "Science Way",
            Role = StaffRole.Teacher
        });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await attendanceService.ExecuteAsync(new RecordAttendanceRequest
        {
            ChildId = child.Id,
            ArrivalTime = DateTime.UtcNow.AddHours(-4),
            Status = AttendanceStatus.Present,
            RecordedById = staff.Id
        });

        await mealService.ExecuteAsync(new RecordMealRequest
        {
            ChildId = child.Id,
            StaffId = staff.Id,
            Food = "Oatmeal and Fruit",
            Type = MealType.Breakfast,
            MealTime = DateTime.UtcNow.AddHours(-3),
            Status = MealStatus.Eaten
        });

        await activityService.ExecuteAsync(new RecordActivityRequest
        {
            ChildId = child.Id,
            ActivityType = ActivityType.Play,
            ActivityDescription = "Outdoor exploration",
            StartTime = DateTime.UtcNow.AddHours(-2),
            EndTime = DateTime.UtcNow.AddHours(-1),
            RecordedById = staff.Id
        });

        var controller = new ReportsController(reportService);
        var result = await controller.GetDailyReport(today, classroom.Id, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var report = Assert.IsType<DailyReportResponse>(okResult.Value);

        Assert.Equal(today, report.Date);
        Assert.Equal(classroom.Id, report.ClassroomId);
        Assert.Equal(classroom.Name, report.ClassroomName);
        Assert.True(report.TotalChildren >= 1);
        Assert.True(report.TotalPresent >= 1);
        Assert.True(report.TotalMeals >= 1);
        Assert.True(report.TotalActivities >= 1);
        Assert.Contains(report.Attendance, a => a.ChildId == child.Id);
        Assert.Contains(report.Meals, m => m.ChildId == child.Id);
        Assert.Contains(report.Activities, a => a.ChildId == child.Id);
        Assert.Contains(report.Children, c => c.ChildId == child.Id);
    }

    [Fact]
    public async Task Entities_ChildGuardianAndChildAllergy_PersistProperly()
    {
        var guardian = new Guardian
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "Guardian",
            Phone = "123",
            Email = $"g_{Guid.NewGuid():N}@test.com",
            Address = "Test St",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var child = new Child
        {
            Id = Guid.NewGuid(),
            FirstName = "Allergy",
            LastName = "Kid",
            DateOfBirth = new DateOnly(2023, 1, 1),
            Gender = "Male",
            GuardianId = guardian.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var childGuardian = new ChildGuardian
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            GuardianId = guardian.Id,
            RelationshipType = RelationshipType.Father,
            IsPrimary = true,
            IsEmergencyContact = true,
            EmergencyPriority = 1,
            IsAuthorizedPickup = true
        };

        var allergy = new ChildAllergy
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            AllergenName = "Peanuts",
            Severity = AllergySeverity.LifeThreateningAnaphylaxis,
            Reaction = "Hives and airway constriction",
            HasEpiPen = true,
            EpiPenLocation = "Emergency medical bag in Classroom A"
        };

        _fixture.DbContext.Guardians.Add(guardian);
        _fixture.DbContext.Children.Add(child);
        _fixture.DbContext.ChildGuardians.Add(childGuardian);
        _fixture.DbContext.ChildAllergies.Add(allergy);
        await _fixture.DbContext.SaveChangesAsync();

        var retrievedAllergy = await _fixture.DbContext.ChildAllergies
            .FirstOrDefaultAsync(a => a.ChildId == child.Id);
        Assert.NotNull(retrievedAllergy);
        Assert.Equal("Peanuts", retrievedAllergy.AllergenName);
        Assert.Equal(AllergySeverity.LifeThreateningAnaphylaxis, retrievedAllergy.Severity);
        Assert.True(retrievedAllergy.HasEpiPen);

        var retrievedGuardianRel = await _fixture.DbContext.ChildGuardians
            .FirstOrDefaultAsync(cg => cg.ChildId == child.Id && cg.GuardianId == guardian.Id);
        Assert.NotNull(retrievedGuardianRel);
        Assert.Equal(RelationshipType.Father, retrievedGuardianRel.RelationshipType);
        Assert.True(retrievedGuardianRel.IsPrimary);
    }
}
