namespace Daycare.Domain.Entities;

public enum IncidentSeverity
{
    Minor = 0,
    Moderate = 1,
    Critical = 2
}

public class IncidentReport
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public Guid? ClassroomId { get; set; }

    public Classroom? Classroom { get; set; }

    public Guid ReportedByStaffId { get; set; }

    public Staff ReportedByStaff { get; set; } = null!;

    public DateTime IncidentTime { get; set; } = DateTime.UtcNow;

    public string IncidentType { get; set; } = "Minor Injury"; // Fall, Scrape, Bruise, Bite, AllergicReaction, Illness, Other

    public string Location { get; set; } = "Playground"; // Playground, Classroom, Restroom, Hallway, Cafeteria

    public string Description { get; set; } = string.Empty;

    public string FirstAidAdministered { get; set; } = string.Empty;

    public string? WitnessStaffNames { get; set; }

    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Minor;

    public bool ParentNotified { get; set; } = true;

    public DateTime? ParentNotifiedAt { get; set; } = DateTime.UtcNow;

    public string ParentNotifiedMethod { get; set; } = "App"; // Phone, InPerson, App

    public bool IsAcknowledgedByParent { get; set; } = false;

    public DateTime? ParentAcknowledgedAt { get; set; }

    public string? ParentSignatureName { get; set; }

    public string? ParentComments { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
