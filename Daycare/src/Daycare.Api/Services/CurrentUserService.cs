using System.Security.Claims;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;

namespace Daycare.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }

    public Guid? UserId
    {
        get
        {
            var idClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;

            return Guid.TryParse(idClaim, out var id) ? id : null;
        }
    }

    public string? Email =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
        ?? _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value;

    public string? Role =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
        ?? _httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value;

    public Guid? StaffId
    {
        get
        {
            var staffClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("staff_id")?.Value;
            return Guid.TryParse(staffClaim, out var id) ? id : null;
        }
    }

    public Guid? GuardianId
    {
        get
        {
            var guardianClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("guardian_id")?.Value;
            return Guid.TryParse(guardianClaim, out var id) ? id : null;
        }
    }

    public Guid? ChildId
    {
        get
        {
            var childClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("child_id")?.Value;
            return Guid.TryParse(childClaim, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public bool IsAdmin =>
        string.Equals(Role, Roles.Admin, StringComparison.OrdinalIgnoreCase);

    public bool IsStaff =>
        string.Equals(Role, Roles.Staff, StringComparison.OrdinalIgnoreCase) || IsAdmin;

    public bool IsParent =>
        string.Equals(Role, Roles.Parent, StringComparison.OrdinalIgnoreCase);
}
