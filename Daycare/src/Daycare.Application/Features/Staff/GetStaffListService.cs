using Daycare.Application.DTOs.Staff;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Staff;

public interface IGetStaffListService
{
    Task<IReadOnlyList<StaffResponse>> ExecuteAsync(string? isActive = "true", CancellationToken cancellationToken = default);
}

public class GetStaffListService : IGetStaffListService
{
    private readonly IDaycareDbContext _db;

    public GetStaffListService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<StaffResponse>> ExecuteAsync(string? isActive = "true", CancellationToken cancellationToken = default)
    {
        var query = _db.Staff.AsNoTracking();

        if (string.Equals(isActive, "false", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => !s.IsActive);
        }
        else if (!string.Equals(isActive, "all", StringComparison.OrdinalIgnoreCase))
        {
            // Default to active only
            query = query.Where(s => s.IsActive);
        }

        return await query
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Select(staff => new StaffResponse
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
            })
            .ToListAsync(cancellationToken);
    }
}

