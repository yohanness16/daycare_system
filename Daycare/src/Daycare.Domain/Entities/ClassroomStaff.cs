namespace Daycare.Domain.Entities;

public class ClassroomStaff {

    public Guid Id { get; set; }

    public Guid ClassroomId { get; set; }

    public Classroom Classroom { get; set; } = null!;

    public Guid StaffId { get; set; }

    public Staff Staff { get; set; } = null!;

    public DateTime AssignedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}