using Daycare.Application.DTOs.Parent;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Parent;

public interface IGetParentProfileService
{
    Task<ParentProfileResponse> ExecuteAsync(CancellationToken cancellationToken = default);
}

public class GetParentProfileService : IGetParentProfileService
{
    private readonly IParentAccessService _parentAccessService;
    private readonly IDaycareDbContext _db;
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;

    public GetParentProfileService(
        IParentAccessService parentAccessService,
        IDaycareDbContext db,
        IAuthService authService,
        ICurrentUserService currentUserService)
    {
        _parentAccessService = parentAccessService;
        _db = db;
        _authService = authService;
        _currentUserService = currentUserService;
    }

    public async Task<ParentProfileResponse> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var guardian = await _db.Guardians.FirstOrDefaultAsync(g => g.Id == guardianId, cancellationToken);
        if (guardian == null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        DateTime? accountCreatedAt = null;
        DateTime? lastLoginAt = null;

        if (_currentUserService.UserId.HasValue)
        {
            var userProfile = await _authService.GetUserProfileAsync(_currentUserService.UserId.Value, cancellationToken);
            if (userProfile != null)
            {
                accountCreatedAt = userProfile.CreatedAt;
                lastLoginAt = userProfile.LastLoginAt;
            }
        }

        return new ParentProfileResponse
        {
            GuardianId = guardian.Id,
            FirstName = guardian.FirstName,
            LastName = guardian.LastName,
            Email = guardian.Email,
            Phone = guardian.Phone,
            Address = guardian.Address,
            AccountCreatedAt = accountCreatedAt,
            LastLoginAt = lastLoginAt
        };
    }
}
