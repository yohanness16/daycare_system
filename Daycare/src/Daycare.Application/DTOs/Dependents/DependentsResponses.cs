namespace Daycare.Application.DTOs.Dependents;

public class GuardianDependentsResponse
{
    public int Children { get; set; }
}

public class ClassroomDependentsResponse
{
    public int ActiveEnrollments { get; set; }
    public int ActiveStaff { get; set; }
}

public class StaffDependentsResponse
{
    public int MealRecords { get; set; }
    public int AttendanceRecords { get; set; }
    public int ActivityRecords { get; set; }
    public int ActiveClassrooms { get; set; }
}

public class ChildDependentsResponse
{
    public int Enrollments { get; set; }
    public int Attendances { get; set; }
    public int Meals { get; set; }
    public int Activities { get; set; }
}
