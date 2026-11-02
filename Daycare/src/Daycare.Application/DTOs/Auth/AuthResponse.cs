namespace Daycare.Application.DTOs.Auth;

public class AuthResponse
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public Guid? StaffId { get; set; }

    public Guid? GuardianId { get; set; }

    public Guid? ChildId { get; set; }

    public string? ChildName { get; set; }

    public bool MustChangePassword { get; set; }

    public string AccessToken { get; set; } = string.Empty;

    public DateTime AccessTokenExpiresAt { get; set; }
}
