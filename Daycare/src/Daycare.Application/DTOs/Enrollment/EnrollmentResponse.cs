using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Enrollment;

public class EnrollmentResponse
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public string ChildName { get; set; } = string.Empty;

    public Guid ClassroomId { get; set; }

    public string ClassroomName { get; set; } = string.Empty;

    public EnrollmentStatus Status { get; set; }

    public DateTime EnrollmentDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
