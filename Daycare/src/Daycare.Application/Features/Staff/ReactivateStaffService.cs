using Daycare.Application.DTOs.Staff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Staff;

public interface IReactivateStaffService
{
    Task<StaffResponse> ExecuteAsync(Guid staffId, CancellationToken cancellationToken = default);
}

public class ReactivateStaffService : IReactivateStaffService
{
    private readonly IDaycareDbContext _db;
    private readonly IAuthService? _authService;

    public ReactivateStaffService(IDaycareDbContext db, IAuthService? authService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _authService = authService;
    }

    public async Task<StaffResponse> ExecuteAsync(Guid staffId, CancellationToken cancellationToken = default)
    {
        var staff = await _db.Staff.FirstOrDefaultAsync(s => s.Id == staffId, cancellationToken);
        if (staff is null)
            throw new KeyNotFoundException($"Staff member with ID '{staffId}' was not found.");

        staff.IsActive = true;
        staff.DeactivatedAt = null;
        staff.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        if (_authService != null)
        {
            await _authService.SetStaffUserActiveAsync(staffId, true, cancellationToken);
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
