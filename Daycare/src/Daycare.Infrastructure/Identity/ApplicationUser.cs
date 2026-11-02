using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Daycare.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public Guid? StaffId { get; set; }

    public Staff? Staff { get; set; }

    public Guid? GuardianId { get; set; }

    public Guardian? Guardian { get; set; }

    public Guid? ChildId { get; set; }

    public Child? Child { get; set; }

    public bool MustChangePassword { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

