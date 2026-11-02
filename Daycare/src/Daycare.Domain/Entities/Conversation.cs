namespace Daycare.Domain.Entities;

public enum ConversationType
{
    Direct = 0,
    Classroom = 1,
    Center = 2
}

public class Conversation
{
    public Guid Id { get; set; }

    public ConversationType Type { get; set; } = ConversationType.Direct;

    public string Title { get; set; } = string.Empty;

    public Guid? ChildId { get; set; }

    public Child? Child { get; set; }

    public Guid? ClassroomId { get; set; }

    public Classroom? Classroom { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastMessageAt { get; set; }

    public string? LastMessagePreview { get; set; }

    public string? LastMessageSenderName { get; set; }

    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
