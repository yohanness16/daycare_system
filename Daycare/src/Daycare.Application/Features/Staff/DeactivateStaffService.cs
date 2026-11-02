using Daycare.Application.DTOs.Staff;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Staff;

public interface IDeactivateStaffService
{
    Task<StaffResponse> ExecuteAsync(Guid staffId, CancellationToken cancellationToken = default);
}

public class DeactivateStaffService : IDeactivateStaffService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService? _currentUserService;
    private readonly IAuthService? _authService;

    public DeactivateStaffService(
        IDaycareDbContext db,
        ICurrentUserService? currentUserService = null,
        IAuthService? authService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService;
        _authService = authService;
    }

    public async Task<StaffResponse> ExecuteAsync(Guid staffId, CancellationToken cancellationToken = default)
    {
        var staff = await _db.Staff.FirstOrDefaultAsync(s => s.Id == staffId, cancellationToken);
        if (staff is null)
            throw new KeyNotFoundException($"Staff member with ID '{staffId}' was not found.");

        if (_currentUserService?.StaffId == staffId)
            throw new InvalidOperationException("You cannot deactivate your own account.");

        // Check last active admin
        if (staff.StaffRole == StaffRole.Admin)
        {
            var activeAdminCount = await _db.Staff.CountAsync(s => s.StaffRole == StaffRole.Admin && s.IsActive, cancellationToken);
            if (activeAdminCount <= 1)
                throw new InvalidOperationException("Cannot deactivate the last active administrator.");
        }

        staff.IsActive = false;
        staff.DeactivatedAt = DateTime.UtcNow;
        staff.UpdatedAt = DateTime.UtcNow;

        // Remove active classroom staff assignments
        var assignments = await _db.ClassroomStaff.Where(cs => cs.StaffId == staffId).ToListAsync(cancellationToken);
        _db.ClassroomStaff.RemoveRange(assignments);

        await _db.SaveChangesAsync(cancellationToken);

        // Deactivate linked user and revoke all refresh tokens
        if (_authService != null)
        {
            await _authService.SetStaffUserActiveAsync(staffId, false, cancellationToken);
        }

        return new StaffResponse
        {
            Id = staff.Id,
            FirstName = staff.FirstName,
            LastName = staff.LastName,
            Phone = staff.Phone,
            Email = staff.Email,
            Address = staff.Address,
            Role = staff.StaffRole,
            IsActive = staff.IsActive,
            DeactivatedAt = staff.DeactivatedAt,
            CreatedAt = staff.CreatedAt,
            UpdatedAt = staff.UpdatedAt
        };
    }
}
