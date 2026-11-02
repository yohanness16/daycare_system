namespace Daycare.Domain.Entities;

public enum AllergySeverity
{
    Mild,
    Moderate,
    Severe,
    LifeThreateningAnaphylaxis
}

public class ChildAllergy
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public string AllergenName { get; set; } = string.Empty;

    public AllergySeverity Severity { get; set; } = AllergySeverity.Moderate;

    public string Reaction { get; set; } = string.Empty;

    public bool HasEpiPen { get; set; }

    public string? EpiPenLocation { get; set; }

    public string? ActionPlan { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
