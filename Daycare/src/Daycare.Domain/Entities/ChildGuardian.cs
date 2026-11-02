namespace Daycare.Domain.Entities;

public enum RelationshipType
{
    Mother,
    Father,
    Guardian,
    Grandparent,
    Relative,
    Other
}

public class ChildGuardian
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public Guid GuardianId { get; set; }

    public Guardian Guardian { get; set; } = null!;

    public RelationshipType RelationshipType { get; set; } = RelationshipType.Guardian;

    public bool IsPrimary { get; set; }

    public bool IsSecondary { get; set; }

    public bool IsEmergencyContact { get; set; }

    public int? EmergencyPriority { get; set; }

    public bool IsAuthorizedPickup { get; set; } = true;

    public string? PickupPinHash { get; set; }

    public bool HasCustodyRestrictions { get; set; }

    public string? CustodyNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
