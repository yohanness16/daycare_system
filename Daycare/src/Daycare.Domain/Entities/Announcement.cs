namespace Daycare.Domain.Entities;

public class Announcement
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string Audience { get; set; } = "All"; // All, Classroom, Child

    public string AuthorName { get; set; } = "Daycare Center Administration";

    public bool RequiresAcknowledgement { get; set; } = false;

    public bool IsAcknowledged { get; set; } = false;

    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
}
