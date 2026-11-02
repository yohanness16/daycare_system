using Daycare.Application.DTOs.Auth;

namespace Daycare.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<(AuthResponse Response, string RefreshToken)> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task<bool> RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task<UserProfileResponse?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<AuthResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);

    Task<string> CreateStaffUserAccountAsync(Guid staffId, string firstName, string lastName, string email, string role, CancellationToken cancellationToken = default);

    PasswordPolicyResponse GetPasswordPolicy();

    Task<AdminResetPasswordResponse> AdminResetPasswordAsync(Guid targetUserId, AdminResetPasswordRequest? request, Guid requestingAdminUserId, CancellationToken cancellationToken = default);

    Task<AdminResetPasswordResponse> ResetStaffPasswordAsync(Guid staffId, AdminResetPasswordRequest? request, Guid requestingAdminUserId, CancellationToken cancellationToken = default);

    Task SetStaffUserActiveAsync(Guid staffId, bool isActive, CancellationToken cancellationToken = default);

    Task<Daycare.Application.DTOs.Guardians.CreateGuardianAccountResponse> CreateGuardianUserAccountAsync(Guid guardianId, CancellationToken cancellationToken = default);

    Task<Daycare.Application.DTOs.Guardians.CreateGuardianAccountResponse> ResetGuardianPasswordAsync(Guid guardianId, CancellationToken cancellationToken = default);

    Task DisableGuardianAccountAsync(Guid guardianId, CancellationToken cancellationToken = default);

    Task EnableGuardianAccountAsync(Guid guardianId, CancellationToken cancellationToken = default);

    Task<Daycare.Application.DTOs.Guardians.GuardianAccountStatusResponse> GetGuardianAccountAsync(Guid guardianId, CancellationToken cancellationToken = default);
}


