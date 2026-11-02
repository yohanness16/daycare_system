using Daycare.Application.DTOs.Staff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Staff;

public interface IGetStaffService
{
    Task<StaffResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class GetStaffService : IGetStaffService
{
    private readonly IDaycareDbContext _db;

    public GetStaffService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<StaffResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var staff = await _db.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (staff is null)
            return null;

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
