namespace Daycare.Application.DTOs.Chat;

public class SendMessageRequest
{
    public string Body { get; set; } = string.Empty;

    public string? ClientId { get; set; }

    public Guid? ReplyToMessageId { get; set; }
}

public class CreateConversationRequest
{
    public int Type { get; set; } = 0; // 0=Direct, 1=Classroom, 2=Center

    public Guid? ChildId { get; set; }

    public Guid? TargetUserId { get; set; }

    public Guid? RecipientStaffId { get; set; }

    public string? Title { get; set; }

    public string? InitialMessage { get; set; }
}
