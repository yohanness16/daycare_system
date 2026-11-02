using Daycare.Application.DTOs.Auth;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        ICurrentUserService currentUserService,
        IWebHostEnvironment env)
    {
        _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _env = env ?? throw new ArgumentNullException(nameof(env));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var (response, refreshToken) = await _authService.LoginAsync(request, cancellationToken);
            SetRefreshTokenCookie(refreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _authService.RegisterAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest? request, CancellationToken cancellationToken)
    {
        var token = Request.Cookies["refreshToken"] ?? request?.RefreshToken;

        if (string.IsNullOrWhiteSpace(token))
        {
            return Unauthorized(new { message = "Refresh token is missing." });
        }

        try
        {
            var (response, newRefreshToken) = await _authService.RefreshTokenAsync(token, cancellationToken);
            SetRefreshTokenCookie(newRefreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var token = Request.Cookies["refreshToken"];
        if (!string.IsNullOrWhiteSpace(token))
        {
            await _authService.RevokeTokenAsync(token, cancellationToken);
        }

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Strict
        });

        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            return Unauthorized();
        }

        var profile = await _authService.GetUserProfileAsync(_currentUserService.UserId.Value, cancellationToken);
        if (profile is null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(profile);
    }

    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            return Unauthorized();
        }

        var response = await _authService.ChangePasswordAsync(_currentUserService.UserId.Value, request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("password-policy")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PasswordPolicyResponse), StatusCodes.Status200OK)]
    public IActionResult GetPasswordPolicy()
    {
        var policy = _authService.GetPasswordPolicy();
        return Ok(policy);
    }

    [HttpPost("admin-reset-password/{userId:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(AdminResetPasswordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdminResetPassword(Guid userId, [FromBody] AdminResetPasswordRequest? request, CancellationToken cancellationToken)
    {
        var currentAdminId = _currentUserService.UserId ?? Guid.Empty;
        var result = await _authService.AdminResetPasswordAsync(userId, request, currentAdminId, cancellationToken);
        return Ok(result);
    }


    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(), // In development localhost http works; in production HTTPS required
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
