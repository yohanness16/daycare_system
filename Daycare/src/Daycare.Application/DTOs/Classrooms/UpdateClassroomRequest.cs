namespace Daycare.Application.DTOs.Classrooms;

public class UpdateClassroomRequest
{
    public string Name { get; set; } = string.Empty;

    public int Capacity { get; set; }
}
