using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Guardians;

public interface IGetGuardianService
{
    Task<GuardianResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class GetGuardianService : IGetGuardianService
{
    private readonly IDaycareDbContext _db;

    public GetGuardianService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<GuardianResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var guardian = await _db.Guardians
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);

        if (guardian is null)
            return null;

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
