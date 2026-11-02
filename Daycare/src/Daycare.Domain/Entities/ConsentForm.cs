namespace Daycare.Domain.Entities;

public class ConsentForm
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string Version { get; set; } = "1.0";

    public bool Required { get; set; } = true;

    public string Decision { get; set; } = "NeedsResponse"; // NeedsResponse, Granted, Denied

    public DateTime? RespondedAt { get; set; }

    public Guid? ChildId { get; set; }
}
