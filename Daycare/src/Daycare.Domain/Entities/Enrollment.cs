namespace Daycare.Domain.Entities;

public enum EnrollmentStatus
{
    Active,
    Inactive,
    Completed,
    Cancelled
}   

public class Enrollment
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public Guid ClassroomId { get; set; }

    public Classroom Classroom { get; set; } = null!;

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;

    public DateTime EnrollmentDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}