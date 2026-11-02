using Daycare.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Tests;

public static class TestDbContextFactory
{
    public static DaycareDbContext Create(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<DaycareDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;

        return new DaycareDbContext(options);
    }
}
