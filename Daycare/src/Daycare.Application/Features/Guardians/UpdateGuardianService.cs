using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Guardians;

public interface IUpdateGuardianService
{
    Task<GuardianResponse> ExecuteAsync(Guid id, UpdateGuardianRequest request, CancellationToken cancellationToken = default);
}

public class UpdateGuardianService : IUpdateGuardianService
{
    private readonly IDaycareDbContext _db;

    public UpdateGuardianService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<GuardianResponse> ExecuteAsync(
        Guid id,
        UpdateGuardianRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.", nameof(request.FirstName));

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.", nameof(request.LastName));

        var guardian = await _db.Guardians
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);

        if (guardian is null)
            throw new KeyNotFoundException($"Guardian with ID '{id}' was not found.");

        guardian.FirstName = request.FirstName.Trim();
        guardian.LastName = request.LastName.Trim();
        guardian.Phone = request.Phone.Trim();
        guardian.Email = request.Email.Trim();
        guardian.Address = request.Address.Trim();
        if (request.PhotoUrl != null)
        {
            guardian.PhotoUrl = request.PhotoUrl;
        }
        guardian.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new GuardianResponse
        {
            Id = guardian.Id,
            FirstName = guardian.FirstName,
            LastName = guardian.LastName,
            Phone = guardian.Phone,
            Email = guardian.Email,
            Address = guardian.Address,
            PhotoUrl = guardian.PhotoUrl
        };
    }
}
