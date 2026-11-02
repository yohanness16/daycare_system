namespace Daycare.Application.DTOs.Enrollment;

public class TransferChildClassroomRequest
{
    public Guid ChildId { get; set; }

    public Guid NewClassroomId { get; set; }

    public DateTime? TransferDate { get; set; }
}
