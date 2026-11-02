using Daycare.Application.DTOs.Auth;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Daycare.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IDaycareDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IDaycareDbContext db,
        ITokenService tokenService)
    {
        _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.", nameof(request.Email));

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.", nameof(request.Password));

        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.", nameof(request.FirstName));

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.", nameof(request.LastName));

        var targetRole = string.IsNullOrWhiteSpace(request.Role) ? Roles.Staff : request.Role.Trim();

        if (targetRole != Roles.Admin && targetRole != Roles.Staff)
        {
            throw new ArgumentException($"Role must be either '{Roles.Admin}' or '{Roles.Staff}'.", nameof(request.Role));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            throw new InvalidOperationException($"A user with email '{request.Email}' already exists.");
        }

        if (request.StaffId.HasValue && request.StaffId.Value != Guid.Empty)
        {
            var staffExists = await _db.Staff.AnyAsync(s => s.Id == request.StaffId.Value, cancellationToken);
            if (!staffExists)
            {
                throw new KeyNotFoundException($"Staff member with ID '{request.StaffId.Value}' was not found.");
            }
        }

        // Ensure roles exist in DB
        if (!await _roleManager.RoleExistsAsync(targetRole))
        {
            await _roleManager.CreateAsync(new ApplicationRole(targetRole));
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            StaffId = request.StaffId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create user: {errors}");
        }

        var roleResult = await _userManager.AddToRoleAsync(user, targetRole);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to assign role: {errors}");
        }

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, targetRole);

        return new AuthResponse
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = targetRole,
            StaffId = user.StaffId,
            MustChangePassword = user.MustChangePassword,
            AccessToken = accessToken,
            AccessTokenExpiresAt = expiresAt
        };
    }

    public async Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var rawIdentifier = (!string.IsNullOrWhiteSpace(request.Username) ? request.Username : request.Email)?.Trim();
        if (string.IsNullOrWhiteSpace(rawIdentifier))
            throw new ArgumentException("Email or Username is required.", nameof(request.Email));

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.", nameof(request.Password));

        var normalizedIdentifier = rawIdentifier.ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(normalizedIdentifier)
                   ?? await _userManager.FindByNameAsync(normalizedIdentifier);

        if (user is null)
        {
            var childMatch = await _db.Children.FirstOrDefaultAsync(c =>
                (c.FirstName.ToLower() + "." + c.LastName.ToLower() == normalizedIdentifier) ||
                (c.FirstName.ToLower() + " " + c.LastName.ToLower() == normalizedIdentifier) ||
                (c.FirstName.ToLower() + c.LastName.ToLower() == normalizedIdentifier), cancellationToken);

            if (childMatch != null)
            {
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.ChildId == childMatch.Id, cancellationToken);
            }
        }

        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid email, username, or password.");
        }

        if (!user.IsActive)
        {
            throw new Daycare.Domain.Exceptions.AccountDisabledException("This account has been deactivated.");
        }

        if (!user.StaffId.HasValue && !string.IsNullOrEmpty(user.Email))
        {
            var userEmail = user.Email.ToLowerInvariant();
            var staff = await _db.Staff.FirstOrDefaultAsync(s => s.Email.ToLower() == userEmail, cancellationToken);
            if (staff != null)
            {
                user.StaffId = staff.Id;
                await _userManager.UpdateAsync(user);
            }
        }

        if (user.StaffId.HasValue)
        {
            var linkedStaff = await _db.Staff.FirstOrDefaultAsync(s => s.Id == user.StaffId.Value, cancellationToken);
            if (linkedStaff != null && !linkedStaff.IsActive)
            {
                throw new Daycare.Domain.Exceptions.AccountDisabledException("Your staff account has been deactivated.");
            }
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
            var remainingSeconds = lockoutEnd.HasValue
                ? Math.Max(0, (int)(lockoutEnd.Value.UtcDateTime - DateTime.UtcNow).TotalSeconds)
                : 900;
            var remainingMinutes = Math.Max(1, (int)Math.Ceiling(remainingSeconds / 60.0));
            throw new Daycare.Domain.Exceptions.AccountLockedException(
                $"Account is locked due to too many failed attempts. Try again in {remainingMinutes} minute(s).",
                remainingSeconds);
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            await _userManager.AccessFailedAsync(user);
            if (await _userManager.IsLockedOutAsync(user))
            {
                var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                var remainingSeconds = lockoutEnd.HasValue
                    ? Math.Max(0, (int)(lockoutEnd.Value.UtcDateTime - DateTime.UtcNow).TotalSeconds)
                    : 900;
                var remainingMinutes = Math.Max(1, (int)Math.Ceiling(remainingSeconds / 60.0));
                throw new Daycare.Domain.Exceptions.AccountLockedException(
                    $"Account is locked due to too many failed attempts. Try again in {remainingMinutes} minute(s).",
                    remainingSeconds);
            }
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? Roles.Staff;

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, primaryRole);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(cancellationToken);

        string? childName = null;
        if (user.ChildId.HasValue)
        {
            var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == user.ChildId.Value, cancellationToken);
            if (child != null)
            {
                childName = $"{child.FirstName} {child.LastName}".Trim();
            }
        }

        var response = new AuthResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = primaryRole,
            StaffId = user.StaffId,
            GuardianId = user.GuardianId,
            ChildId = user.ChildId,
            ChildName = childName,
            MustChangePassword = user.MustChangePassword,
            AccessToken = accessToken,
            AccessTokenExpiresAt = expiresAt
        };

        return (response, refreshToken.Token);
    }

    public async Task<(AuthResponse Response, string RefreshToken)> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new UnauthorizedAccessException("Refresh token is required.");

        var existingToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        if (existingToken is null || !existingToken.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        var user = await _userManager.FindByIdAsync(existingToken.UserId.ToString());
        if (user is null)
        {
            throw new UnauthorizedAccessException("User not found.");
        }

        // Revoke current refresh token and issue new one (rotation)
        var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id);
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByToken = newRefreshToken.Token;

        _db.RefreshTokens.Add(newRefreshToken);
        await _db.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? Roles.Staff;
        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, primaryRole);

        var response = new AuthResponse
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = primaryRole,
            StaffId = user.StaffId,
            MustChangePassword = user.MustChangePassword,
            AccessToken = accessToken,
            AccessTokenExpiresAt = expiresAt
        };

        return (response, newRefreshToken.Token);
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return false;

        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        if (token is null || !token.IsActive)
            return false;

        token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<UserProfileResponse?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.Users
            .Include(u => u.Staff)
            .Include(u => u.Guardian)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            return null;

        var roles = await _userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? Roles.Staff;

        int? childrenCount = null;
        if (user.GuardianId.HasValue)
        {
            childrenCount = await _db.Children.CountAsync(c => c.GuardianId == user.GuardianId.Value, cancellationToken);
        }

        string? childName = null;
        if (user.ChildId.HasValue)
        {
            var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == user.ChildId.Value, cancellationToken);
            if (child != null)
            {
                childName = $"{child.FirstName} {child.LastName}".Trim();
            }
        }

        return new UserProfileResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = primaryRole,
            StaffId = user.StaffId,
            StaffName = user.Staff != null ? $"{user.Staff.FirstName} {user.Staff.LastName}".Trim() : null,
            GuardianId = user.GuardianId,
            GuardianName = user.Guardian != null ? $"{user.Guardian.FirstName} {user.Guardian.LastName}".Trim() : null,
            ChildId = user.ChildId,
            ChildName = childName,
            ChildrenCount = childrenCount,
            MustChangePassword = user.MustChangePassword,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<AuthResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            throw new ArgumentException("Current password is required.", nameof(request.CurrentPassword));

        if (string.IsNullOrWhiteSpace(request.NewPassword))
            throw new ArgumentException("New password is required.", nameof(request.NewPassword));

        if (request.CurrentPassword == request.NewPassword)
            throw new ArgumentException("New password must be different from current password.", nameof(request.NewPassword));

        var validationErrors = new List<string>();
        if (request.NewPassword.Length < 8)
            validationErrors.Add("Must be at least 8 characters.");
        if (!request.NewPassword.Any(char.IsUpper))
            validationErrors.Add("Must contain an uppercase letter.");
        if (!request.NewPassword.Any(char.IsLower))
            validationErrors.Add("Must contain a lowercase letter.");
        if (!request.NewPassword.Any(char.IsDigit))
            validationErrors.Add("Must contain a digit.");

        if (validationErrors.Count > 0)
        {
            throw new Daycare.Domain.Exceptions.PasswordPolicyException(
                "Password does not meet requirements.",
                new Dictionary<string, string[]> { { "newPassword", validationErrors.ToArray() } });
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new UnauthorizedAccessException("User not found.");
        }

        var changeResult = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changeResult.Succeeded)
        {
            var errors = string.Join("; ", changeResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to change password: {errors}");
        }

        user.MustChangePassword = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? Roles.Staff;

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, primaryRole);

        return new AuthResponse
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = primaryRole,
            StaffId = user.StaffId,
            MustChangePassword = false,
            AccessToken = accessToken,
            AccessTokenExpiresAt = expiresAt
        };
    }

    public async Task<string> CreateStaffUserAccountAsync(
        Guid staffId,
        string firstName,
        string lastName,
        string email,
        string role,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var cleanFirst = char.ToUpper(firstName.Trim()[0]) + (firstName.Trim().Length > 1 ? firstName.Trim()[1..].ToLowerInvariant().Replace(" ", "") : "");
        var cleanLast = lastName.Trim().ToLowerInvariant().Replace(" ", "");
        var defaultPassword = $"{cleanFirst}.{cleanLast}1!";

        var targetRole = string.IsNullOrWhiteSpace(role) ? Roles.Staff : role;
        if (!await _roleManager.RoleExistsAsync(targetRole))
        {
            await _roleManager.CreateAsync(new ApplicationRole(targetRole));
        }

        var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
        if (existingUser != null)
        {
            if (existingUser.StaffId != staffId)
            {
                existingUser.StaffId = staffId;
                await _userManager.UpdateAsync(existingUser);
            }
            return defaultPassword;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            StaffId = staffId,
            MustChangePassword = true,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, defaultPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create staff user account: {errors}");
        }

        var roleResult = await _userManager.AddToRoleAsync(user, targetRole);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to assign role to staff user: {errors}");
        }

        return defaultPassword;
    }

    public PasswordPolicyResponse GetPasswordPolicy()
    {
        return new PasswordPolicyResponse
        {
            MinLength = 8,
            RequireUppercase = true,
            RequireLowercase = true,
            RequireDigit = true,
            RequireSymbol = false
        };
    }

    public async Task<AdminResetPasswordResponse> AdminResetPasswordAsync(
        Guid targetUserId,
        AdminResetPasswordRequest? request,
        Guid requestingAdminUserId,
        CancellationToken cancellationToken = default)
    {
        if (targetUserId == requestingAdminUserId)
        {
            throw new ArgumentException("Admin cannot reset their own password through this route. Use change-password instead.");
        }

        var user = await _userManager.FindByIdAsync(targetUserId.ToString());
        if (user is null)
        {
            throw new KeyNotFoundException($"User with ID '{targetUserId}' was not found.");
        }

        var tempPassword = request?.TemporaryPassword;
        if (string.IsNullOrWhiteSpace(tempPassword))
        {
            var cleanFirst = char.ToUpper(user.FirstName.Trim()[0]) + (user.FirstName.Trim().Length > 1 ? user.FirstName.Trim()[1..].ToLowerInvariant().Replace(" ", "") : "");
            var cleanLast = user.LastName.Trim().ToLowerInvariant().Replace(" ", "");
            tempPassword = $"{cleanFirst}.{cleanLast}{Random.Shared.Next(100, 999)}!";
        }
        else
        {
            var validationErrors = new List<string>();
            if (tempPassword.Length < 8) validationErrors.Add("Must be at least 8 characters.");
            if (!tempPassword.Any(char.IsUpper)) validationErrors.Add("Must contain an uppercase letter.");
            if (!tempPassword.Any(char.IsLower)) validationErrors.Add("Must contain a lowercase letter.");
            if (!tempPassword.Any(char.IsDigit)) validationErrors.Add("Must contain a digit.");

            if (validationErrors.Count > 0)
            {
                throw new Daycare.Domain.Exceptions.PasswordPolicyException(
                    "Temporary password does not meet requirements.",
                    new Dictionary<string, string[]> { { "temporaryPassword", validationErrors.ToArray() } });
            }
        }

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, tempPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join("; ", resetResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to reset password: {errors}");
        }

        user.MustChangePassword = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Revoke all active refresh tokens for the user
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(cancellationToken);

        return new AdminResetPasswordResponse
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            TemporaryPassword = tempPassword,
            MustChangePassword = true
        };
    }

    public async Task<AdminResetPasswordResponse> ResetStaffPasswordAsync(
        Guid staffId,
        AdminResetPasswordRequest? request,
        Guid requestingAdminUserId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.StaffId == staffId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"No user account found linked to Staff ID '{staffId}'.");
        }

        return await AdminResetPasswordAsync(user.Id, request, requestingAdminUserId, cancellationToken);
    }

    public async Task SetStaffUserActiveAsync(Guid staffId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.StaffId == staffId, cancellationToken);
        if (user != null)
        {
            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;

            if (!isActive)
            {
                var activeTokens = await _db.RefreshTokens
                    .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                    .ToListAsync(cancellationToken);

                foreach (var t in activeTokens)
                {
                    t.RevokedAt = DateTime.UtcNow;
                }
            }

            await _userManager.UpdateAsync(user);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<CreateGuardianAccountResponse> CreateGuardianUserAccountAsync(Guid guardianId, CancellationToken cancellationToken = default)
    {
        var guardian = await _db.Guardians.FirstOrDefaultAsync(g => g.Id == guardianId, cancellationToken);
        if (guardian == null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        if (string.IsNullOrWhiteSpace(guardian.Email))
        {
            throw new ArgumentException("Guardian must have an email address to create a portal account.");
        }

        var normalizedEmail = guardian.Email.Trim().ToLowerInvariant();

        var existingUserForGuardian = await _userManager.Users.FirstOrDefaultAsync(u => u.GuardianId == guardianId, cancellationToken);
        if (existingUserForGuardian != null)
        {
            throw new InvalidOperationException($"Guardian already has an active portal account with email '{existingUserForGuardian.Email}'.");
        }

        var existingUserByEmail = await _userManager.FindByEmailAsync(normalizedEmail);
        if (existingUserByEmail != null)
        {
            throw new InvalidOperationException($"A user account with email '{guardian.Email}' already exists.");
        }

        if (!await _roleManager.RoleExistsAsync(Roles.Parent))
        {
            await _roleManager.CreateAsync(new ApplicationRole(Roles.Parent));
        }

        var cleanFirst = char.ToUpper(guardian.FirstName.Trim()[0]) + (guardian.FirstName.Trim().Length > 1 ? guardian.FirstName.Trim()[1..].ToLowerInvariant().Replace(" ", "") : "");
        var cleanLast = guardian.LastName.Trim().ToLowerInvariant().Replace(" ", "");
        var tempPassword = $"{cleanFirst}.{cleanLast}1!";

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FirstName = guardian.FirstName.Trim(),
            LastName = guardian.LastName.Trim(),
            GuardianId = guardianId,
            MustChangePassword = true,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, tempPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create guardian portal account: {errors}");
        }

        var roleResult = await _userManager.AddToRoleAsync(user, Roles.Parent);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to assign Parent role: {errors}");
        }

        return new CreateGuardianAccountResponse
        {
            UserId = user.Id,
            GuardianId = guardianId,
            Email = user.Email,
            TemporaryPassword = tempPassword,
            MustChangePassword = true
        };
    }

    public async Task<CreateGuardianAccountResponse> ResetGuardianPasswordAsync(Guid guardianId, CancellationToken cancellationToken = default)
    {
        var guardian = await _db.Guardians.FirstOrDefaultAsync(g => g.Id == guardianId, cancellationToken);
        if (guardian == null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.GuardianId == guardianId, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"No portal account exists for guardian '{guardianId}'.");
        }

        var cleanFirst = char.ToUpper(user.FirstName.Trim()[0]) + (user.FirstName.Trim().Length > 1 ? user.FirstName.Trim()[1..].ToLowerInvariant().Replace(" ", "") : "");
        var cleanLast = user.LastName.Trim().ToLowerInvariant().Replace(" ", "");
        var tempPassword = $"{cleanFirst}.{cleanLast}1!";

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, tempPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join("; ", resetResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to reset password: {errors}");
        }

        user.MustChangePassword = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateGuardianAccountResponse
        {
            UserId = user.Id,
            GuardianId = guardianId,
            Email = user.Email ?? string.Empty,
            TemporaryPassword = tempPassword,
            MustChangePassword = true
        };
    }

    public async Task DisableGuardianAccountAsync(Guid guardianId, CancellationToken cancellationToken = default)
    {
        var guardian = await _db.Guardians.FirstOrDefaultAsync(g => g.Id == guardianId, cancellationToken);
        if (guardian == null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.GuardianId == guardianId, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"No portal account exists for guardian '{guardianId}'.");
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task EnableGuardianAccountAsync(Guid guardianId, CancellationToken cancellationToken = default)
    {
        var guardian = await _db.Guardians.FirstOrDefaultAsync(g => g.Id == guardianId, cancellationToken);
        if (guardian == null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.GuardianId == guardianId, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"No portal account exists for guardian '{guardianId}'.");
        }

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
    }

    public async Task<GuardianAccountStatusResponse> GetGuardianAccountAsync(Guid guardianId, CancellationToken cancellationToken = default)
    {
        var guardianExists = await _db.Guardians.AnyAsync(g => g.Id == guardianId, cancellationToken);
        if (!guardianExists)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.GuardianId == guardianId, cancellationToken);
        if (user == null)
        {
            return new GuardianAccountStatusResponse
            {
                HasAccount = false
            };
        }

        return new GuardianAccountStatusResponse
        {
            HasAccount = true,
            UserId = user.Id,
            Email = user.Email,
            IsActive = user.IsActive,
            MustChangePassword = user.MustChangePassword,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt
        };
    }
}

