namespace Daycare.Application.DTOs.Enrollment;

public class EnrollChildRequest
{
    public Guid ChildId { get; set; }

    public Guid ClassroomId { get; set; }

    public DateTime EnrollmentDate { get; set; }
}
