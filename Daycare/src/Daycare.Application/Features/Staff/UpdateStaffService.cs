using Daycare.Application.DTOs.Staff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Staff;

public interface IUpdateStaffService
{
    Task<StaffResponse> ExecuteAsync(Guid id, UpdateStaffRequest request, CancellationToken cancellationToken = default);
}

public class UpdateStaffService : IUpdateStaffService
{
    private readonly IDaycareDbContext _db;

    public UpdateStaffService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<StaffResponse> ExecuteAsync(Guid id, UpdateStaffRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.", nameof(request.FirstName));

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.", nameof(request.LastName));

        var staff = await _db.Staff
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (staff is null)
            throw new KeyNotFoundException($"Staff member with ID '{id}' was not found.");

        staff.FirstName = request.FirstName.Trim();
        staff.LastName = request.LastName.Trim();
        staff.Phone = request.Phone.Trim();
        staff.Email = request.Email.Trim();
        staff.Address = request.Address.Trim();
        staff.StaffRole = request.Role;
        if (request.PhotoUrl != null)
        {
            staff.PhotoUrl = request.PhotoUrl;
        }
        staff.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new StaffResponse
        {
            Id = staff.Id,
            FirstName = staff.FirstName,
            LastName = staff.LastName,
            Phone = staff.Phone,
            Email = staff.Email,
            Address = staff.Address,
            Role = staff.StaffRole,
            PhotoUrl = staff.PhotoUrl,
            IsActive = staff.IsActive,
            DeactivatedAt = staff.DeactivatedAt,
            CreatedAt = staff.CreatedAt,
            UpdatedAt = staff.UpdatedAt
        };

    }
}
