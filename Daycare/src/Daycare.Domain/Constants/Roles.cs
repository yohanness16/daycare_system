namespace Daycare.Domain.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Parent = "Parent";

    public static readonly IReadOnlyList<string> All = new[] { Admin, Staff, Parent };
}
