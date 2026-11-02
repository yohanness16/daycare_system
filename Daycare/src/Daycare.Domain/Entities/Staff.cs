namespace Daycare.Domain.Entities;

public enum StaffRole
{
    Admin,
    Teacher,
    Caregiver,
    SupportStaff,
    Assistant,
    Feeder,
    Administrator,
    Manager
}

public class Staff
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    public StaffRole StaffRole { get; set; } = StaffRole.SupportStaff;

    public bool IsActive { get; set; } = true;

    public DateTime? DeactivatedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}