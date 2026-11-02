namespace Daycare.Application.DTOs.ClassroomStaff;

public class AssignStaffToClassroomRequest
{
    public Guid ClassroomId { get; set; }

    public Guid StaffId { get; set; }

    public DateTime? AssignedAt { get; set; }
}
