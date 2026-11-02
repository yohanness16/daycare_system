using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Staff;

public class StaffResponse
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public StaffRole Role { get; set; }

    public string? PhotoUrl { get; set; }

    public string? DefaultPassword { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? DeactivatedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

