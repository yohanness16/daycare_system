using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;

namespace Daycare.Application.Features.Guardians;

public interface ICreateGuardianService
{
    Task<GuardianResponse> ExecuteAsync(CreateGuardianRequest request, CancellationToken cancellationToken = default);
}

public class CreateGuardianService : ICreateGuardianService
{
    private readonly IDaycareDbContext _db;

    public CreateGuardianService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<GuardianResponse> ExecuteAsync(
        CreateGuardianRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.", nameof(request.FirstName));

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.", nameof(request.LastName));

        var guardian = new Guardian
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim(),
            Address = request.Address.Trim(),
            PhotoUrl = request.PhotoUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Guardians.Add(guardian);

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
