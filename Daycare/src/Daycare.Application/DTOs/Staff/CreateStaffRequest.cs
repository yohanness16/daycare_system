using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Staff;

public class CreateStaffRequest
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public StaffRole Role { get; set; } = StaffRole.SupportStaff;

    public string? PhotoUrl { get; set; }
}
