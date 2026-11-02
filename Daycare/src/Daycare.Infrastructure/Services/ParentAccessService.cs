using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Infrastructure.Services;

public class ParentAccessService : IParentAccessService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IDaycareDbContext _db;

    public ParentAccessService(ICurrentUserService currentUserService, IDaycareDbContext db)
    {
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public Guid CurrentGuardianId
    {
        get
        {
            if (_currentUserService.GuardianId.HasValue)
            {
                return _currentUserService.GuardianId.Value;
            }

            if (_currentUserService.ChildId.HasValue)
            {
                var child = _db.Children.FirstOrDefault(c => c.Id == _currentUserService.ChildId.Value);
                if (child != null)
                {
                    return child.GuardianId;
                }
            }

            throw new UnauthorizedAccessException("Current user is not associated with a guardian or child account.");
        }
    }

    public async Task<bool> OwnsChildAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        if (_currentUserService.ChildId.HasValue)
        {
            return childId == _currentUserService.ChildId.Value;
        }

        var guardianId = _currentUserService.GuardianId;
        if (!guardianId.HasValue)
        {
            return false;
        }

        return await _db.Children.AnyAsync(c => c.Id == childId && (c.GuardianId == guardianId.Value || c.Guardians.Any(g => g.GuardianId == guardianId.Value)), cancellationToken);
    }

    public IQueryable<Child> OwnChildren()
    {
        if (_currentUserService.ChildId.HasValue)
        {
            var cid = _currentUserService.ChildId.Value;
            return _db.Children.Where(c => c.Id == cid);
        }

        var guardianId = _currentUserService.GuardianId;
        if (!guardianId.HasValue)
        {
            return _db.Children.Where(c => false);
        }

        return _db.Children.Where(c => c.GuardianId == guardianId.Value || c.Guardians.Any(g => g.GuardianId == guardianId.Value));
    }
}
