using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Guardians;

public interface IGetGuardiansService
{
    Task<IReadOnlyList<GuardianResponse>> ExecuteAsync(string? searchTerm = null, CancellationToken cancellationToken = default);
}

public class GetGuardiansService : IGetGuardiansService
{
    private readonly IDaycareDbContext _db;

    public GetGuardiansService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<GuardianResponse>> ExecuteAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        var query = _db.Guardians.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(g =>
                g.FirstName.ToLower().Contains(term) ||
                g.LastName.ToLower().Contains(term) ||
                g.Email.ToLower().Contains(term) ||
                g.Phone.Contains(term));
        }

        return await query
            .OrderBy(g => g.LastName)
            .ThenBy(g => g.FirstName)
            .Select(g => new GuardianResponse
            {
                Id = g.Id,
                FirstName = g.FirstName,
                LastName = g.LastName,
                Phone = g.Phone,
                Email = g.Email,
                Address = g.Address,
                PhotoUrl = g.PhotoUrl
            })
            .ToListAsync(cancellationToken);
    }
}
