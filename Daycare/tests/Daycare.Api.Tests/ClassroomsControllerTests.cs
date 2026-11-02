using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Classrooms;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using Xunit;

namespace Daycare.Api.Tests;

public class ClassroomsControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public ClassroomsControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task CreateAndGetClassroom_Succeeds()
    {
        var controller = _fixture.CreateController<ClassroomsController>(role: Roles.Admin);

        var request = new CreateClassroomRequest
        {
            Name = "Toddler Room",
            Capacity = 12
        };

        var postResult = await controller.Create(request, CancellationToken.None);
        var createdResult = Assert.IsType<CreatedAtActionResult>(postResult);
        var classroom = Assert.IsType<ClassroomResponse>(createdResult.Value);
        Assert.Equal("Toddler Room", classroom.Name);
        Assert.Equal(12, classroom.Capacity);

        // Get By Id
        var getResult = await controller.GetById(classroom.Id, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(getResult);
        var fetched = Assert.IsType<ClassroomResponse>(okResult.Value);
        Assert.Equal(classroom.Id, fetched.Id);
    }

    [Fact]
    public void Create_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(ClassroomsController).GetMethod(nameof(ClassroomsController.Create));
        Assert.NotNull(method);
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void Update_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(ClassroomsController).GetMethod(nameof(ClassroomsController.Update));
        Assert.NotNull(method);
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void Delete_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(ClassroomsController).GetMethod(nameof(ClassroomsController.Delete));
        Assert.NotNull(method);
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }
}
