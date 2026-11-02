using System.Text;
using Daycare.Api.Hubs;
using Daycare.Api.Services;
using Daycare.Application;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Daycare.Infrastructure;
using Daycare.Infrastructure.Configuration;
using Daycare.Infrastructure.Identity;
using Daycare.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Controllers, SignalR & Context Accessor
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Database & Persistence
builder.Services.AddDbContext<DaycareDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
builder.Services.AddScoped<IDaycareDbContext>(sp => sp.GetRequiredService<DaycareDbContext>());

// Clean Architecture Layers
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
var key = Encoding.UTF8.GetBytes(string.IsNullOrEmpty(jwtSettings.Secret) 
    ? "DaycareSecretKey2026SuperSecureAndLongEnoughToSatisfySha256Requirements!" 
    : jwtSettings.Secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var traceId = System.Diagnostics.Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
            context.Response.Headers["X-Trace-Id"] = traceId;
            var err = new Daycare.Application.DTOs.Common.ApiErrorResponse
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = "Authentication credentials are required or invalid.",
                Code = "UNAUTHORIZED",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            };
            await context.Response.WriteAsJsonAsync(err);
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            var traceId = System.Diagnostics.Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
            context.Response.Headers["X-Trace-Id"] = traceId;
            var err = new Daycare.Application.DTOs.Common.ApiErrorResponse
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden",
                Detail = "You do not have permission to access this resource.",
                Code = "FORBIDDEN",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            };
            await context.Response.WriteAsJsonAsync(err);
        }
    };
});

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Roles.Admin, policy => policy.RequireRole(Roles.Admin));
    options.AddPolicy(Roles.Staff, policy => policy.RequireRole(Roles.Staff, Roles.Admin));
});

// CORS for Frontend (React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseMiddleware<Daycare.Api.Middleware.ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");

var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}

app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<DaycareHub>("/hubs/daycare");

app.MapGet("/api/hello", () => new { message = "Hi Mr. Yohannes" });

// Run Database Migrations and Seed Roles / initial Admin user
for (int attempt = 1; attempt <= 10; attempt++)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DaycareDbContext>();
        await dbContext.Database.MigrateAsync();
        await IdentityDataSeeder.SeedAsync(app.Services);
        break;
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        if (attempt == 10)
        {
            logger.LogError(ex, "Failed to apply database migrations after multiple attempts.");
        }
        else
        {
            logger.LogWarning("Database migration/seed attempt {Attempt} failed: {Message}. Retrying in 2s...", attempt, ex.Message);
            await Task.Delay(2000);
        }
    }
}

app.Run();
