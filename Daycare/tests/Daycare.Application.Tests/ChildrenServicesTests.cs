using Daycare.Application.DTOs.Children;
using Daycare.Application.Features.Children;
using Daycare.Domain.Entities;
using Xunit;

namespace Daycare.Application.Tests;

public class ChildrenServicesTests
{
    [Fact]
    public async Task RegisterChildService_ValidRequest_RegistersSuccessfully()
    {
        using var db = TestDbContextFactory.Create();
        var guardian = new Guardian
        {
            Id = Guid.NewGuid(),
            FirstName = "Jane",
            LastName = "Doe",
            Phone = "123-456-7890",
            Email = "jane@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Guardians.Add(guardian);
        await db.SaveChangesAsync();

        var service = new RegisterChildService(db);
        var request = new RegisterChildRequest
        {
            FirstName = "Tommy",
            LastName = "Doe",
            DateOfBirth = new DateOnly(2022, 5, 10),
            Gender = "Male",
            GuardianId = guardian.Id
        };

        var response = await service.ExecuteAsync(request);

        Assert.NotNull(response);
        Assert.Equal("Tommy", response.FirstName);
        Assert.Equal("Doe", response.LastName);
        Assert.Equal(guardian.Id, response.GuardianId);
        Assert.Equal("Jane Doe", response.GuardianName);
    }

    [Fact]
    public async Task RegisterChildService_FutureDateOfBirth_ThrowsArgumentException()
    {
        using var db = TestDbContextFactory.Create();
        var service = new RegisterChildService(db);
        var request = new RegisterChildRequest
        {
            FirstName = "Baby",
            LastName = "Doe",
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            GuardianId = Guid.NewGuid()
        };

        await Assert.ThrowsAsync<ArgumentException>(() => service.ExecuteAsync(request));
    }

    [Fact]
    public async Task UpdateChildService_ValidRequest_UpdatesChild()
    {
        using var db = TestDbContextFactory.Create();
        var guardian = new Guardian
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Smith",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var child = new Child
        {
            Id = Guid.NewGuid(),
            FirstName = "Johnny",
            LastName = "Smith",
            DateOfBirth = new DateOnly(2021, 1, 1),
            Gender = "Male",
            GuardianId = guardian.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Guardians.Add(guardian);
        db.Children.Add(child);
        await db.SaveChangesAsync();

        var service = new UpdateChildService(db);
        var updateRequest = new UpdateChildRequest
        {
            FirstName = "Jonathan",
            LastName = "Smith",
            DateOfBirth = new DateOnly(2021, 1, 1),
            Gender = "Male",
            GuardianId = guardian.Id
        };

        var response = await service.ExecuteAsync(child.Id, updateRequest);

        Assert.Equal("Jonathan", response.FirstName);
        var updatedChild = await db.Children.FindAsync(child.Id);
        Assert.Equal("Jonathan", updatedChild!.FirstName);
    }

    [Fact]
    public async Task DeleteChildService_ExistingChild_DeletesSuccessfully()
    {
        using var db = TestDbContextFactory.Create();
        var child = new Child
        {
            Id = Guid.NewGuid(),
            FirstName = "Alice",
            LastName = "Wonderland",
            DateOfBirth = new DateOnly(2020, 3, 15),
            Gender = "Female",
            GuardianId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Children.Add(child);
        await db.SaveChangesAsync();

        var service = new DeleteChildService(db);
        await service.ExecuteAsync(child.Id);

        var deletedChild = await db.Children.FindAsync(child.Id);
        Assert.Null(deletedChild);
    }
}
