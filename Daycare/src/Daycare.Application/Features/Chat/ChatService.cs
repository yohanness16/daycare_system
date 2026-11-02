using Daycare.Application.DTOs.Chat;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Chat;

public class ChatService : IChatService
{
    private readonly IDaycareDbContext _db;

    public ChatService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<ConversationResponse>> GetUserConversationsAsync(
        Guid userId, 
        Guid? staffId = null, 
        bool isAdmin = false, 
        CancellationToken cancellationToken = default)
    {
        IQueryable<Conversation> query = _db.Conversations
            .Include(c => c.Child)
            .Include(c => c.Participants);

        if (!isAdmin)
        {
            query = query.Where(c => c.Participants.Any(p => 
                (p.UserId == userId || (staffId.HasValue && p.UserId == staffId.Value)) 
                && p.LeftAt == null));
        }

        var conversations = await query
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToListAsync(cancellationToken);

        // If none found for this user, check if we should return empty
        var result = new List<ConversationResponse>();

        foreach (var conv in conversations)
        {
            var userParticipant = conv.Participants.FirstOrDefault(p => p.UserId == userId);
            var unreadCount = 0;

            if (userParticipant?.LastReadAt != null)
            {
                unreadCount = await _db.ChatMessages
                    .CountAsync(m => m.ConversationId == conv.Id && m.CreatedAt > userParticipant.LastReadAt.Value && m.SenderUserId != userId, cancellationToken);
            }
            else
            {
                unreadCount = await _db.ChatMessages
                    .CountAsync(m => m.ConversationId == conv.Id && m.SenderUserId != userId, cancellationToken);
            }

            result.Add(new ConversationResponse
            {
                Id = conv.Id,
                Type = (int)conv.Type,
                Title = conv.Title,
                ChildId = conv.ChildId,
                ChildName = conv.Child != null ? $"{conv.Child.FirstName} {conv.Child.LastName}" : null,
                UnreadCount = unreadCount,
                IsMuted = userParticipant?.IsMuted ?? false,
                LastMessage = conv.LastMessageAt.HasValue
                    ? new LastMessageSummaryResponse
                    {
                        Preview = conv.LastMessagePreview ?? string.Empty,
                        SenderName = conv.LastMessageSenderName ?? string.Empty,
                        At = conv.LastMessageAt.Value
                    }
                    : null,
                Participants = conv.Participants.Select(p => new ConversationParticipantResponse
                {
                    UserId = p.UserId,
                    Name = p.UserName,
                    Role = p.UserRole,
                    PhotoUrl = p.PhotoUrl
                }).ToList()
            });
        }

        return result;
    }

    public async Task<IReadOnlyList<ChatMessageResponse>> GetConversationMessagesAsync(Guid conversationId, Guid userId, int limit = 50, CancellationToken cancellationToken = default)
    {
        var messages = await _db.ChatMessages
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        // Reverse to chronological order (oldest to newest)
        messages.Reverse();

        return messages.Select(m => new ChatMessageResponse
        {
            Id = m.Id,
            ConversationId = m.ConversationId,
            ClientId = m.ClientId,
            Sender = new ChatSenderResponse
            {
                UserId = m.SenderUserId,
                Name = m.SenderName,
                Role = m.SenderRole,
                PhotoUrl = m.SenderPhotoUrl
            },
            Type = 0,
            Body = m.Body,
            ReplyTo = m.ReplyToMessageId.HasValue
                ? new ChatReplyToResponse
                {
                    Id = m.ReplyToMessageId.Value,
                    Preview = m.ReplyToPreview ?? string.Empty
                }
                : null,
            CreatedAt = m.CreatedAt,
            EditedAt = m.EditedAt,
            IsDeleted = m.IsDeleted,
            Status = m.Status
        }).ToList();
    }

    public async Task<ChatMessageResponse> SendMessageAsync(
        Guid conversationId,
        Guid userId,
        string userName,
        string userRole,
        string? userPhoto,
        SendMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Body))
            throw new ArgumentException("Message body cannot be empty.", nameof(request.Body));

        var conversation = await _db.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken);

        if (conversation is null)
            throw new KeyNotFoundException($"Conversation with ID '{conversationId}' was not found.");

        // Check if user is a participant; if not, add them
        var participant = conversation.Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant == null)
        {
            participant = new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                ConversationId = conversationId,
                UserId = userId,
                UserName = userName,
                UserRole = userRole,
                PhotoUrl = userPhoto,
                JoinedAt = DateTime.UtcNow,
                LastReadAt = DateTime.UtcNow
            };
            _db.ConversationParticipants.Add(participant);
        }
        else
        {
            participant.LastReadAt = DateTime.UtcNow;
        }

        string? replyPreview = null;
        if (request.ReplyToMessageId.HasValue)
        {
            var parentMsg = await _db.ChatMessages
                .FirstOrDefaultAsync(m => m.Id == request.ReplyToMessageId.Value, cancellationToken);
            if (parentMsg != null)
            {
                replyPreview = parentMsg.Body.Length > 50 ? parentMsg.Body.Substring(0, 47) + "..." : parentMsg.Body;
            }
        }

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderUserId = userId,
            SenderName = userName,
            SenderRole = userRole,
            SenderPhotoUrl = userPhoto,
            Body = request.Body.Trim(),
            ClientId = request.ClientId,
            ReplyToMessageId = request.ReplyToMessageId,
            ReplyToPreview = replyPreview,
            CreatedAt = DateTime.UtcNow,
            Status = "sent"
        };

        _db.ChatMessages.Add(message);

        conversation.LastMessageAt = message.CreatedAt;
        conversation.LastMessagePreview = message.Body.Length > 60 ? message.Body.Substring(0, 57) + "..." : message.Body;
        conversation.LastMessageSenderName = userName;
        conversation.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new ChatMessageResponse
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            ClientId = message.ClientId,
            Sender = new ChatSenderResponse
            {
                UserId = message.SenderUserId,
                Name = message.SenderName,
                Role = message.SenderRole,
                PhotoUrl = message.SenderPhotoUrl
            },
            Type = 0,
            Body = message.Body,
            ReplyTo = message.ReplyToMessageId.HasValue
                ? new ChatReplyToResponse
                {
                    Id = message.ReplyToMessageId.Value,
                    Preview = message.ReplyToPreview ?? string.Empty
                }
                : null,
            CreatedAt = message.CreatedAt,
            IsDeleted = false,
            Status = "sent"
        };
    }

    public async Task<ConversationResponse> CreateConversationAsync(
        Guid userId,
        string userName,
        string userRole,
        string? userPhoto,
        CreateConversationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        string? childName = null;
        if (request.ChildId.HasValue)
        {
            var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == request.ChildId.Value, cancellationToken);
            if (child != null)
            {
                childName = $"{child.FirstName} {child.LastName}";
            }
        }

        var title = request.Title ?? (childName != null ? $"Discussion regarding {childName}" : "Center Inquiries");

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            Type = (ConversationType)request.Type,
            Title = title,
            ChildId = request.ChildId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add creator as participant
        conversation.Participants.Add(new ConversationParticipant
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            UserId = userId,
            UserName = userName,
            UserRole = userRole,
            PhotoUrl = userPhoto,
            JoinedAt = DateTime.UtcNow,
            LastReadAt = DateTime.UtcNow
        });

        // Add target teacher or user if specified
        var targetStaffId = request.RecipientStaffId ?? request.TargetUserId;
        if (targetStaffId.HasValue && targetStaffId.Value != userId)
        {
            var targetStaff = await _db.Staff.FirstOrDefaultAsync(s => s.Id == targetStaffId.Value, cancellationToken);
            if (targetStaff != null)
            {
                conversation.Participants.Add(new ConversationParticipant
                {
                    Id = Guid.NewGuid(),
                    ConversationId = conversation.Id,
                    UserId = targetStaff.Id,
                    UserName = $"{targetStaff.FirstName} {targetStaff.LastName}".Trim(),
                    UserRole = "Teacher",
                    PhotoUrl = targetStaff.PhotoUrl,
                    JoinedAt = DateTime.UtcNow
                });
            }
        }
        else if (request.Type == 1 || (request.Title != null && request.Title.Contains("Admin", StringComparison.OrdinalIgnoreCase)))
        {
            conversation.Participants.Add(new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                UserName = "Center Administration",
                UserRole = "Admin",
                JoinedAt = DateTime.UtcNow
            });
        }

        _db.Conversations.Add(conversation);

        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            var msg = new ChatMessage
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                SenderUserId = userId,
                SenderName = userName,
                SenderRole = userRole,
                SenderPhotoUrl = userPhoto,
                Body = request.InitialMessage.Trim(),
                CreatedAt = DateTime.UtcNow,
                Status = "sent"
            };
            _db.ChatMessages.Add(msg);
            conversation.LastMessageAt = msg.CreatedAt;
            conversation.LastMessagePreview = msg.Body.Length > 60 ? msg.Body.Substring(0, 57) + "..." : msg.Body;
            conversation.LastMessageSenderName = userName;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new ConversationResponse
        {
            Id = conversation.Id,
            Type = (int)conversation.Type,
            Title = conversation.Title,
            ChildId = conversation.ChildId,
            ChildName = childName,
            UnreadCount = 0,
            IsMuted = false,
            LastMessage = conversation.LastMessageAt.HasValue
                ? new LastMessageSummaryResponse
                {
                    Preview = conversation.LastMessagePreview ?? string.Empty,
                    SenderName = conversation.LastMessageSenderName ?? string.Empty,
                    At = conversation.LastMessageAt.Value
                }
                : null,
            Participants = conversation.Participants.Select(p => new ConversationParticipantResponse
            {
                UserId = p.UserId,
                Name = p.UserName,
                Role = p.UserRole,
                PhotoUrl = p.PhotoUrl
            }).ToList()
        };
    }

    public async Task MarkConversationReadAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var participant = await _db.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId, cancellationToken);

        if (participant != null)
        {
            participant.LastReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
