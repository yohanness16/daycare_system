namespace Daycare.Application.DTOs.Auth;

public class UserProfileResponse
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public Guid? StaffId { get; set; }

    public string? StaffName { get; set; }

    public Guid? GuardianId { get; set; }

    public string? GuardianName { get; set; }

    public Guid? ChildId { get; set; }

    public string? ChildName { get; set; }

    public int? ChildrenCount { get; set; }

    public bool MustChangePassword { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
