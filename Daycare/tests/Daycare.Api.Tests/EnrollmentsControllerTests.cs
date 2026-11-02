using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Children;
using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Features.Children;
using Daycare.Application.Features.Classrooms;
using Daycare.Application.Features.Guardians;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Daycare.Api.Tests;

public class EnrollmentsControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public EnrollmentsControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task EnrollChild_Transfer_AndEndEnrollment_Succeeds()
    {
        // 1. Setup Guardian, Child, and 2 Classrooms
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Paul",
            LastName = "Walker",
            Email = $"paul_{Guid.NewGuid():N}@example.com",
            Phone = "555-3344",
            Address = "456 Ocean Drive"
        });

        var childService = scope.ServiceProvider.GetRequiredService<IRegisterChildService>();
        var child = await childService.ExecuteAsync(new RegisterChildRequest
        {
            FirstName = "Lucas",
            LastName = "Walker",
            DateOfBirth = new DateOnly(2022, 8, 15),
            Gender = "Male",
            GuardianId = guardian.Id
        });

        var classroomService = scope.ServiceProvider.GetRequiredService<ICreateClassroomService>();
        var roomA = await classroomService.ExecuteAsync(new CreateClassroomRequest { Name = "Room Alpha", Capacity = 10 });
        var roomB = await classroomService.ExecuteAsync(new CreateClassroomRequest { Name = "Room Beta", Capacity = 10 });

        var controller = _fixture.CreateController<EnrollmentsController>(role: Roles.Staff);

        // 2. Enroll
        var enrollRequest = new EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = roomA.Id,
            EnrollmentDate = DateTime.UtcNow
        };
        var enrollResult = await controller.Enroll(enrollRequest, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(enrollResult);
        var enrollment = Assert.IsType<EnrollmentResponse>(created.Value);
        Assert.Equal(roomA.Id, enrollment.ClassroomId);
        Assert.Equal(EnrollmentStatus.Active, enrollment.Status);

        // 3. Transfer
        var transferRequest = new TransferChildClassroomRequest
        {
            ChildId = child.Id,
            NewClassroomId = roomB.Id,
            TransferDate = DateTime.UtcNow
        };
        var transferResult = await controller.Transfer(transferRequest, CancellationToken.None);
        var okTransfer = Assert.IsType<OkObjectResult>(transferResult);
        var transferred = Assert.IsType<EnrollmentResponse>(okTransfer.Value);
        Assert.Equal(roomB.Id, transferred.ClassroomId);

        // 4. End Enrollment
        var endResult = await controller.End(transferred.Id, CancellationToken.None);
        var okEnd = Assert.IsType<OkObjectResult>(endResult);
        var ended = Assert.IsType<EnrollmentResponse>(okEnd.Value);
        Assert.Equal(EnrollmentStatus.Completed, ended.Status);
    }
}
