namespace Daycare.Application.DTOs.Guardians;

public class CreateGuardianAccountResponse
{
    public Guid UserId { get; set; }
    public Guid GuardianId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TemporaryPassword { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; } = true;
}

public class GuardianAccountStatusResponse
{
    public bool HasAccount { get; set; }
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? CreatedAt { get; set; }
}
