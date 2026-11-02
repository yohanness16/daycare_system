using Daycare.Application;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Daycare.Infrastructure;
using Daycare.Infrastructure.Identity;
using Daycare.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Security.Claims;

namespace Daycare.Api.Tests;

public class TestFixture : IDisposable
{
    public ServiceProvider ServiceProvider { get; }
    public DaycareDbContext DbContext { get; }

    public TestFixture()
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();

        // In-memory database
        services.AddDbContext<DaycareDbContext>(options =>
        {
            options.UseInMemoryDatabase(dbName);
        });
        services.AddScoped<IDaycareDbContext>(sp => sp.GetRequiredService<DaycareDbContext>());

        // Configuration
        var configData = new Dictionary<string, string?>
        {
            { "JwtSettings:Secret", "SuperSecretKeyForTestingPurposesOnly12345678901234567890!" },
            { "JwtSettings:Issuer", "DaycareTest" },
            { "JwtSettings:Audience", "DaycareTestApp" },
            { "JwtSettings:AccessTokenExpirationMinutes", "15" },
            { "JwtSettings:RefreshTokenExpirationDays", "7" }
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();
        services.AddSingleton<IConfiguration>(configuration);

        // Core Layers
        services.AddApplicationServices();
        services.AddInfrastructureServices(configuration);

        // HttpContextAccessor & Environment
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, Daycare.Api.Services.CurrentUserService>();
        services.AddSingleton<IWebHostEnvironment, DummyHostEnvironment>();

        ServiceProvider = services.BuildServiceProvider();

        DbContext = ServiceProvider.GetRequiredService<DaycareDbContext>();
        DbContext.Database.EnsureCreated();

        // Seed roles & initial admin user
        IdentityDataSeeder.SeedAsync(ServiceProvider).GetAwaiter().GetResult();
    }

    public TController CreateController<TController>(
        string? role = null,
        Guid? userId = null,
        string? email = null,
        IDictionary<string, string>? cookies = null,
        Guid? staffId = null,
        Guid? guardianId = null) where TController : ControllerBase
    {
        var scope = ServiceProvider.CreateScope();
        var controller = ActivatorUtilities.CreateInstance<TController>(scope.ServiceProvider);

        var httpContext = new DefaultHttpContext();

        if (role != null || userId != null || email != null || staffId != null || guardianId != null)
        {
            var claims = new List<Claim>();
            if (userId.HasValue)
            {
                claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
                claims.Add(new Claim("sub", userId.Value.ToString()));
            }
            if (!string.IsNullOrEmpty(email))
            {
                claims.Add(new Claim(ClaimTypes.Email, email));
            }
            if (!string.IsNullOrEmpty(role))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            if (staffId.HasValue)
            {
                claims.Add(new Claim("staff_id", staffId.Value.ToString()));
            }
            if (guardianId.HasValue)
            {
                claims.Add(new Claim("guardian_id", guardianId.Value.ToString()));
            }

            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
        }

        if (cookies != null && cookies.Count > 0)
        {
            var cookieHeaders = string.Join("; ", cookies.Select(kv => $"{kv.Key}={kv.Value}"));
            httpContext.Request.Headers["Cookie"] = cookieHeaders;
        }

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        var accessor = scope.ServiceProvider.GetService<IHttpContextAccessor>();
        if (accessor != null)
        {
            accessor.HttpContext = httpContext;
        }

        return controller;
    }

    public void Dispose()
    {
        DbContext.Dispose();
        ServiceProvider.Dispose();
    }
}

public class DummyHostEnvironment : IWebHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "Daycare.Api";
    public string WebRootPath { get; set; } = string.Empty;
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string ContentRootPath { get; set; } = string.Empty;
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
}
