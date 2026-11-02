namespace Daycare.Application.DTOs.Auth;

public class AdminResetPasswordResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TemporaryPassword { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; } = true;
}
