namespace Daycare.Domain.Entities;

public class Guardian
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    public ICollection<ChildGuardian> ChildGuardians { get; set; } = new List<ChildGuardian>();

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}