namespace Daycare.Application.DTOs.Classrooms;

public class CreateClassroomRequest
{
    public string Name { get; set; } = string.Empty;

    public int Capacity { get; set; }
}
