using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Auth;
using Daycare.Domain.Constants;
using Daycare.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using Xunit;

namespace Daycare.Api.Tests;

public class AuthControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public AuthControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Login_ValidAdminCredentials_ReturnsOkAndSetsCookie()
    {
        var controller = _fixture.CreateController<AuthController>();

        var request = new LoginRequest
        {
            Email = "admin@daycare.local",
            Password = "Admin@Daycare2026!"
        };

        var result = await controller.Login(request, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var authResponse = Assert.IsType<AuthResponse>(okResult.Value);

        Assert.Equal("admin@daycare.local", authResponse.Email);
        Assert.Equal(Roles.Admin, authResponse.Role);
        Assert.False(string.IsNullOrWhiteSpace(authResponse.AccessToken));

        // Verify Set-Cookie header contains refreshToken
        var setCookieHeader = controller.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("refreshToken=", setCookieHeader);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        var controller = _fixture.CreateController<AuthController>();

        var request = new LoginRequest
        {
            Email = "admin@daycare.local",
            Password = "WrongPassword123!"
        };

        var result = await controller.Login(request, CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Register_AdminRegistersStaff_ReturnsCreated()
    {
        var controller = _fixture.CreateController<AuthController>(role: Roles.Admin);

        var email = $"teacher_{Guid.NewGuid():N}@daycare.local";
        var request = new RegisterRequest
        {
            Email = email,
            Password = "Password123!",
            FirstName = "Jane",
            LastName = "Doe",
            Role = Roles.Staff
        };

        var result = await controller.Register(request, CancellationToken.None);

        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, statusResult.StatusCode);

        var authResponse = Assert.IsType<AuthResponse>(statusResult.Value);
        Assert.Equal(email, authResponse.Email);
        Assert.Equal(Roles.Staff, authResponse.Role);
    }

    [Fact]
    public async Task RefreshToken_ValidCookie_ReturnsOkAndRotatesToken()
    {
        // 1. Login to get refreshToken
        var loginController = _fixture.CreateController<AuthController>();
        var loginResult = await loginController.Login(new LoginRequest
        {
            Email = "admin@daycare.local",
            Password = "Admin@Daycare2026!"
        }, CancellationToken.None);

        var okLogin = Assert.IsType<OkObjectResult>(loginResult);
        var authResponse = Assert.IsType<AuthResponse>(okLogin.Value);

        var setCookie = loginController.Response.Headers["Set-Cookie"].ToString();
        // Parse refreshToken value from Set-Cookie header
        var tokenVal = setCookie.Split(';')[0].Replace("refreshToken=", "").Trim();

        // 2. Call RefreshToken with the cookie
        var refreshController = _fixture.CreateController<AuthController>(
            cookies: new Dictionary<string, string> { { "refreshToken", tokenVal } });

        var refreshResult = await refreshController.RefreshToken(null, CancellationToken.None);

        var okRefresh = Assert.IsType<OkObjectResult>(refreshResult);
        var rotatedAuth = Assert.IsType<AuthResponse>(okRefresh.Value);

        Assert.False(string.IsNullOrWhiteSpace(rotatedAuth.AccessToken));
        Assert.Equal(Roles.Admin, rotatedAuth.Role);

        // Verify new cookie is set
        var newSetCookie = refreshController.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("refreshToken=", newSetCookie);
    }

    [Fact]
    public async Task Logout_ClearsRefreshTokenCookie()
    {
        var controller = _fixture.CreateController<AuthController>(role: Roles.Admin);

        var result = await controller.Logout(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var setCookieHeader = controller.Response.Headers["Set-Cookie"].ToString();

        // Expired cookie to delete
        Assert.Contains("refreshToken=;", setCookieHeader);
    }

    [Fact]
    public async Task GetCurrentUser_WhenAuthenticated_ReturnsProfile()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync("admin@daycare.local");
        Assert.NotNull(user);

        var controller = _fixture.CreateController<AuthController>(
            role: Roles.Admin,
            userId: user.Id,
            email: user.Email);

        var result = await controller.GetCurrentUser(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var profile = Assert.IsType<UserProfileResponse>(okResult.Value);

        Assert.Equal(user.Email, profile.Email);
        Assert.Equal(Roles.Admin, profile.Role);
    }

    [Fact]
    public void Register_RequiresAdminRole_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Register));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(Roles.Admin, attr.Roles);
    }

    [Fact]
    public void Logout_RequiresAuthentication_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Logout));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
    }

    [Fact]
    public void GetCurrentUser_RequiresAuthentication_EnforcedByAuthorizeAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.GetCurrentUser));
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
    }

    [Fact]
    public async Task StaffFirstLogin_WithDefaultPassword_RequiresPasswordChange_ThenUpdatesPassword()
    {
        // 1. Admin creates a new staff member via StaffController
        var staffController = _fixture.CreateController<StaffController>(role: Roles.Admin);
        var staffEmail = $"staff_{Guid.NewGuid():N}@daycare.local";
        var createStaffRequest = new Daycare.Application.DTOs.Staff.CreateStaffRequest
        {
            FirstName = "Beth",
            LastName = "Harmon",
            Email = staffEmail,
            Phone = "555-4321",
            Address = "123 Chess Way",
            Role = Daycare.Domain.Entities.StaffRole.Teacher
        };

        var staffCreateResult = await staffController.Create(createStaffRequest, CancellationToken.None);
        var createdStaffResult = Assert.IsType<CreatedAtActionResult>(staffCreateResult);
        var createdStaff = Assert.IsType<Daycare.Application.DTOs.Staff.StaffResponse>(createdStaffResult.Value);
        Assert.Equal("Beth.harmon1!", createdStaff.DefaultPassword);

        // 2. Staff logs in for the first time with default password
        var authController = _fixture.CreateController<AuthController>();
        var loginRequest = new LoginRequest
        {
            Email = staffEmail,
            Password = createdStaff.DefaultPassword!
        };

        var loginResult = await authController.Login(loginRequest, CancellationToken.None);
        var okLogin = Assert.IsType<OkObjectResult>(loginResult);
        var authResp = Assert.IsType<AuthResponse>(okLogin.Value);

        Assert.Equal(staffEmail, authResp.Email);
        Assert.True(authResp.MustChangePassword, "First-time staff login must require password change.");

        // 3. Staff changes password
        var changeController = _fixture.CreateController<AuthController>(
            role: Roles.Staff,
            userId: authResp.Id,
            email: authResp.Email,
            staffId: authResp.StaffId);

        var changeResult = await changeController.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = createdStaff.DefaultPassword!,
            NewPassword = "QueenGambit2026!"
        }, CancellationToken.None);

        var okChange = Assert.IsType<OkObjectResult>(changeResult);
        var changeResp = Assert.IsType<AuthResponse>(okChange.Value);
        Assert.False(changeResp.MustChangePassword, "MustChangePassword must be false after updating password.");

        // 4. Staff logs in subsequent time with new password
        var secondAuthController = _fixture.CreateController<AuthController>();
        var secondLoginResult = await secondAuthController.Login(new LoginRequest
        {
            Email = staffEmail,
            Password = "QueenGambit2026!"
        }, CancellationToken.None);

        var okSecondLogin = Assert.IsType<OkObjectResult>(secondLoginResult);
        var secondAuthResp = Assert.IsType<AuthResponse>(okSecondLogin.Value);
        Assert.False(secondAuthResp.MustChangePassword, "Subsequent logins must NOT require password change.");
    }

    [Fact]
    public void GetPasswordPolicy_ReturnsConfiguredPolicy()
    {
        var controller = _fixture.CreateController<AuthController>();
        var result = controller.GetPasswordPolicy();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var policy = Assert.IsType<Daycare.Application.DTOs.Auth.PasswordPolicyResponse>(okResult.Value);

        Assert.Equal(8, policy.MinLength);
        Assert.True(policy.RequireUppercase);
        Assert.True(policy.RequireLowercase);
        Assert.True(policy.RequireDigit);
        Assert.False(policy.RequireSymbol);
    }

    [Fact]
    public async Task ChangePassword_WeakPassword_ThrowsPasswordPolicyException()
    {
        var changeController = _fixture.CreateController<AuthController>(
            role: Roles.Admin,
            userId: Guid.NewGuid(),
            email: "admin@daycare.local");

        await Assert.ThrowsAsync<Daycare.Domain.Exceptions.PasswordPolicyException>(() =>
            changeController.ChangePassword(new ChangePasswordRequest
            {
                CurrentPassword = "Admin@Daycare2026!",
                NewPassword = "weak"
            }, CancellationToken.None));
    }

    [Fact]
    public async Task Login_FifthFailedAttempt_LocksAccount()
    {
        var controller = _fixture.CreateController<AuthController>();
        var email = $"locked_{Guid.NewGuid():N}@daycare.local";

        var registerRequest = new RegisterRequest
        {
            Email = email,
            Password = "ValidPassword1!",
            FirstName = "Lock",
            LastName = "User",
            Role = Roles.Staff
        };
        var adminController = _fixture.CreateController<AuthController>(role: Roles.Admin);
        await adminController.Register(registerRequest, CancellationToken.None);

        // 5 failed login attempts
        Daycare.Domain.Exceptions.AccountLockedException? lockedEx = null;
        for (int i = 0; i < 5; i++)
        {
            try
            {
                await controller.Login(new LoginRequest { Email = email, Password = "WrongPassword1!" }, CancellationToken.None);
            }
            catch (Daycare.Domain.Exceptions.AccountLockedException ex)
            {
                lockedEx = ex;
                break;
            }
            catch (UnauthorizedAccessException)
            {
                // Expected on initial attempts
            }
        }

        if (lockedEx == null)
        {
            lockedEx = await Assert.ThrowsAsync<Daycare.Domain.Exceptions.AccountLockedException>(() =>
                controller.Login(new LoginRequest { Email = email, Password = "WrongPassword1!" }, CancellationToken.None));
        }

        Assert.NotNull(lockedEx);
        Assert.Equal("ACCOUNT_LOCKED", lockedEx.Code);
        Assert.Equal(423, lockedEx.StatusCode);
    }

    [Fact]
    public async Task AdminResetPassword_ValidTargetUser_ResetsPasswordAndRevokesTokens()
    {
        var adminController = _fixture.CreateController<AuthController>(role: Roles.Admin, userId: Guid.NewGuid());

        var staffEmail = $"reset_target_{Guid.NewGuid():N}@daycare.local";
        var registerResult = await adminController.Register(new RegisterRequest
        {
            Email = staffEmail,
            Password = "OldPassword1!",
            FirstName = "Oliver",
            LastName = "Queen",
            Role = Roles.Staff
        }, CancellationToken.None);
        var authResp = Assert.IsType<AuthResponse>(((ObjectResult)registerResult).Value);

        var resetResult = await adminController.AdminResetPassword(authResp.Id, new AdminResetPasswordRequest(), CancellationToken.None);
        var okReset = Assert.IsType<OkObjectResult>(resetResult);
        var resetResp = Assert.IsType<AdminResetPasswordResponse>(okReset.Value);

        Assert.Equal(authResp.Id, resetResp.UserId);
        Assert.Equal(staffEmail, resetResp.Email);
        Assert.True(resetResp.MustChangePassword);
        Assert.False(string.IsNullOrWhiteSpace(resetResp.TemporaryPassword));

        var loginController = _fixture.CreateController<AuthController>();
        var loginResult = await loginController.Login(new LoginRequest
        {
            Email = staffEmail,
            Password = resetResp.TemporaryPassword
        }, CancellationToken.None);
        var okLogin = Assert.IsType<OkObjectResult>(loginResult);
        var loginAuth = Assert.IsType<AuthResponse>(okLogin.Value);
        Assert.True(loginAuth.MustChangePassword);
    }

    [Fact]
    public async Task ResetStaffPassword_ValidStaffId_ResetsPassword()
    {
        var adminStaffController = _fixture.CreateController<StaffController>(role: Roles.Admin, userId: Guid.NewGuid());

        var email = $"staff_reset_{Guid.NewGuid():N}@daycare.local";
        var createResult = await adminStaffController.Create(new Daycare.Application.DTOs.Staff.CreateStaffRequest
        {
            FirstName = "Roy",
            LastName = "Harper",
            Email = email,
            Role = Daycare.Domain.Entities.StaffRole.Assistant
        }, CancellationToken.None);
        var created = Assert.IsType<Daycare.Application.DTOs.Staff.StaffResponse>(((CreatedAtActionResult)createResult).Value);

        using var scope = _fixture.ServiceProvider.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();
        var currentUserService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.ICurrentUserService>();

        var resetResult = await adminStaffController.ResetStaffPassword(created.Id, null, authService, currentUserService, CancellationToken.None);
        var okReset = Assert.IsType<OkObjectResult>(resetResult);
        var resetResp = Assert.IsType<AdminResetPasswordResponse>(okReset.Value);

        Assert.Equal(email, resetResp.Email);
        Assert.True(resetResp.MustChangePassword);
    }

}
