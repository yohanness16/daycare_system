using Daycare.Application.DTOs.Parent;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Parent;

public interface IUpdateParentProfileService
{
    Task<ParentProfileResponse> ExecuteAsync(UpdateParentProfileRequest request, CancellationToken cancellationToken = default);
}

public class UpdateParentProfileService : IUpdateParentProfileService
{
    private readonly IParentAccessService _parentAccessService;
    private readonly IDaycareDbContext _db;
    private readonly IGetParentProfileService _getProfileService;

    public UpdateParentProfileService(
        IParentAccessService parentAccessService,
        IDaycareDbContext db,
        IGetParentProfileService getProfileService)
    {
        _parentAccessService = parentAccessService;
        _db = db;
        _getProfileService = getProfileService;
    }

    public async Task<ParentProfileResponse> ExecuteAsync(UpdateParentProfileRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var guardianId = _parentAccessService.CurrentGuardianId;
        var guardian = await _db.Guardians.FirstOrDefaultAsync(g => g.Id == guardianId, cancellationToken);
        if (guardian == null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{guardianId}' was not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            guardian.Phone = request.Phone.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            guardian.Address = request.Address.Trim();
        }

        guardian.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return await _getProfileService.ExecuteAsync(cancellationToken);
    }
}
