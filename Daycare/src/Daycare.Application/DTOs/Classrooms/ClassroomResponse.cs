namespace Daycare.Application.DTOs.Classrooms;

public class ClassroomResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public int CurrentEnrollmentCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
