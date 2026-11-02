namespace Daycare.Application.DTOs.ClassroomStaff;

public class ClassroomStaffResponse
{
    public Guid Id { get; set; }

    public Guid ClassroomId { get; set; }

    public string ClassroomName { get; set; } = string.Empty;

    public Guid StaffId { get; set; }

    public string StaffName { get; set; } = string.Empty;

    public DateTime AssignedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public bool IsActive => EndedAt == null;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
