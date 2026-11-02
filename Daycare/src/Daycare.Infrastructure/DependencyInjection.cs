using Daycare.Application.Interfaces;
using Daycare.Infrastructure.Configuration;
using Daycare.Infrastructure.Identity;
using Daycare.Infrastructure.Persistence;
using Daycare.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Daycare.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // JWT configuration
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Data Protection for token providers
        services.AddDataProtection();

        // Identity Configuration
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;

            // Lockout settings
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddRoles<ApplicationRole>()
        .AddEntityFrameworkStores<DaycareDbContext>()
        .AddDefaultTokenProviders();


        // Infrastructure Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IParentAccessService, ParentAccessService>();

        return services;
    }
}
