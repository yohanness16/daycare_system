using Daycare.Application.DTOs.Staff;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;

namespace Daycare.Application.Features.Staff;

public interface ICreateStaffService
{
    Task<StaffResponse> ExecuteAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
}

public class CreateStaffService : ICreateStaffService
{
    private readonly IDaycareDbContext _db;
    private readonly IAuthService? _authService;

    public CreateStaffService(IDaycareDbContext db, IAuthService? authService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _authService = authService;
    }

    public async Task<StaffResponse> ExecuteAsync(CreateStaffRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.", nameof(request.FirstName));

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.", nameof(request.LastName));

        var staff = new Daycare.Domain.Entities.Staff
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim(),
            Address = request.Address.Trim(),
            StaffRole = request.Role,
            PhotoUrl = request.PhotoUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Staff.Add(staff);
        await _db.SaveChangesAsync(cancellationToken);

        string? defaultPassword = null;
        if (!string.IsNullOrWhiteSpace(staff.Email) && _authService != null)
        {
            var role = staff.StaffRole == StaffRole.Admin ? Roles.Admin : Roles.Staff;
            defaultPassword = await _authService.CreateStaffUserAccountAsync(
                staff.Id,
                staff.FirstName,
                staff.LastName,
                staff.Email,
                role,
                cancellationToken);
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
            PhotoUrl = staff.PhotoUrl,
            DefaultPassword = defaultPassword,
            IsActive = staff.IsActive,
            DeactivatedAt = staff.DeactivatedAt,
            CreatedAt = staff.CreatedAt,
            UpdatedAt = staff.UpdatedAt
        };

    }
}
