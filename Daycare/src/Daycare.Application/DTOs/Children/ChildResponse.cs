namespace Daycare.Application.DTOs.Children;

public class ChildResponse
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public DateOnly DateOfBirth { get; set; }

    public string Gender { get; set; } = string.Empty;

    public Guid GuardianId { get; set; }

    public string GuardianName { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    public List<string> Allergies { get; set; } = new();

    public List<string> DietaryRestrictions { get; set; } = new();

    public string? MedicalNotes { get; set; }

    public string? Medications { get; set; }

    public string? BloodType { get; set; }

    public string? EmergencyContactName { get; set; }

    public string? EmergencyContactPhone { get; set; }

    public string? PediatricianName { get; set; }

    public string? PediatricianPhone { get; set; }

    public string? SpecialNeedsNotes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
