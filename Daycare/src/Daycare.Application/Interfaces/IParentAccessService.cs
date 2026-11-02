using Daycare.Domain.Entities;

namespace Daycare.Application.Interfaces;

public interface IParentAccessService
{
    Guid CurrentGuardianId { get; }

    Task<bool> OwnsChildAsync(Guid childId, CancellationToken cancellationToken = default);

    IQueryable<Child> OwnChildren();
}
