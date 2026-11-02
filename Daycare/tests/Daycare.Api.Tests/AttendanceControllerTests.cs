using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.Children;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Features.Children;
using Daycare.Application.Features.Guardians;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Daycare.Api.Tests;

public class AttendanceControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public AttendanceControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task RecordAndCheckOutAttendance_Succeeds()
    {
        // 1. Create Guardian and Child
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "David",
            LastName = "Miller",
            Email = $"david_{Guid.NewGuid():N}@example.com",
            Phone = "555-7788",
            Address = "100 Pine Street"
        });

        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "Emma",
            LastName = "Miller",
            DateOfBirth = new DateOnly(2023, 1, 10),
            Gender = "Female",
            GuardianId = guardian.Id
        });

        var staffService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Staff.ICreateStaffService>();
        var staff = await staffService.ExecuteAsync(new Daycare.Application.DTOs.Staff.CreateStaffRequest
        {
            FirstName = "Teacher",
            LastName = "Anna",
            Email = $"anna_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-4321",
            Role = Daycare.Domain.Entities.StaffRole.Teacher
        });

        var classroomService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Classrooms.ICreateClassroomService>();
        var classroom = await classroomService.ExecuteAsync(new Daycare.Application.DTOs.Classrooms.CreateClassroomRequest
        {
            Name = "Sunshine Room",
            Capacity = 15
        });

        var enrollService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Enrollment.IEnrollChildService>();
        await enrollService.ExecuteAsync(new Daycare.Application.DTOs.Enrollment.EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        // 2. Record Attendance (Check-in)
        var controller = _fixture.CreateController<AttendanceController>(role: Roles.Staff);
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var recordRequest = new RecordAttendanceRequest
        {
            ChildId = child.Id,
            RecordedById = staff.Id,
            ArrivalTime = now,
            Note = "Arrived cheerfully"
        };

        var postResult = await controller.Record(recordRequest, CancellationToken.None);
        var okPost = Assert.IsType<OkObjectResult>(postResult);
        var attendance = Assert.IsType<AttendanceResponse>(okPost.Value);
        Assert.Equal(child.Id, attendance.ChildId);
        Assert.True(attendance.IsPresent);
        Assert.Equal(Daycare.Domain.Entities.AttendanceStatus.Present, attendance.Status);

        // 3. Checkout Attendance
        var checkOutRequest = new CheckOutAttendanceRequest
        {
            ChildId = child.Id,
            RecordedById = staff.Id,
            Date = today,
            ExitTime = now.AddHours(8),
            PickedUpBy = "Bruce Wayne",
            UnverifiedPickup = false
        };

        var checkOutResult = await controller.CheckOut(checkOutRequest, CancellationToken.None);
        var okCheckOut = Assert.IsType<OkObjectResult>(checkOutResult);
        var checkedOut = Assert.IsType<AttendanceResponse>(okCheckOut.Value);
        Assert.NotNull(checkedOut.DepartureTime);
        Assert.Equal(Daycare.Domain.Entities.AttendanceStatus.CheckedOut, checkedOut.Status);
        Assert.Equal("Bruce Wayne", checkedOut.PickedUpBy);
        Assert.NotNull(checkedOut.DurationMinutes);
        Assert.True(checkedOut.DurationMinutes > 0);

        // 4. Query Daily Attendance
        var getDailyResult = await controller.GetDaily(today, CancellationToken.None);
        var okDaily = Assert.IsType<OkObjectResult>(getDailyResult);
        var dailyList = Assert.IsAssignableFrom<IReadOnlyList<AttendanceResponse>>(okDaily.Value);
        Assert.Contains(dailyList, a => a.ChildId == child.Id);
    }

    [Fact]
    public async Task RecordAttendance_WhenExitTimeBeforeArrivalTime_ThrowsArgumentException()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Time",
            LastName = "Test",
            Email = $"time_{Guid.NewGuid():N}@example.com",
            Phone = "555-0011",
            Address = "123 Time Lane"
        });

        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "Timmy",
            LastName = "Test",
            DateOfBirth = new DateOnly(2023, 5, 5),
            Gender = "Male",
            GuardianId = guardian.Id
        });

        var classroomService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Classrooms.ICreateClassroomService>();
        var classroom = await classroomService.ExecuteAsync(new Daycare.Application.DTOs.Classrooms.CreateClassroomRequest
        {
            Name = "Time Room",
            Capacity = 10
        });

        var enrollService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Enrollment.IEnrollChildService>();
        await enrollService.ExecuteAsync(new Daycare.Application.DTOs.Enrollment.EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        var staffService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Staff.ICreateStaffService>();
        var staff = await staffService.ExecuteAsync(new Daycare.Application.DTOs.Staff.CreateStaffRequest
        {
            FirstName = "Time",
            LastName = "Keeper",
            Email = $"timekeeper_{Guid.NewGuid():N}@example.com",
            Phone = "555-8888",
            Role = Daycare.Domain.Entities.StaffRole.Teacher
        });

        var controller = _fixture.CreateController<AttendanceController>(role: Roles.Staff);
        var now = DateTime.UtcNow;

        var invalidRequest = new RecordAttendanceRequest
        {
            ChildId = child.Id,
            RecordedById = staff.Id,
            ArrivalTime = now,
            ExitTime = now.AddHours(-2), // 2 hours before arrival!
            Note = "Invalid departure time"
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            controller.Record(invalidRequest, CancellationToken.None));
        Assert.Contains("Departure time cannot be earlier than arrival time", ex.Message);
    }
}
