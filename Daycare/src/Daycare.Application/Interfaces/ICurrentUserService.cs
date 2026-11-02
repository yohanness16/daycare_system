namespace Daycare.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }

    string? Email { get; }

    string? Role { get; }

    Guid? StaffId { get; }

    Guid? GuardianId { get; }

    Guid? ChildId { get; }

    bool IsAuthenticated { get; }

    bool IsAdmin { get; }

    bool IsStaff { get; }

    bool IsParent { get; }
}
