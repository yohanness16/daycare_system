namespace Daycare.Application.DTOs.Parent;

public class ParentProfileResponse
{
    public Guid GuardianId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTime? AccountCreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class UpdateParentProfileRequest
{
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Email { get; set; }
}
