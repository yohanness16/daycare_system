using Daycare.Domain.Constants;
using Microsoft.AspNetCore.SignalR;

namespace Daycare.Api.Hubs;

public class DaycareHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated == true)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
            }

            if (Context.User.IsInRole(Roles.Admin))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "role:admin");
            }
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinClassroom(string classroomId)
    {
        if (!string.IsNullOrWhiteSpace(classroomId))
        {
            var group = classroomId.StartsWith("classroom:") ? classroomId : $"classroom:{classroomId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, group);
        }
    }

    public async Task LeaveClassroom(string classroomId)
    {
        if (!string.IsNullOrWhiteSpace(classroomId))
        {
            var group = classroomId.StartsWith("classroom:") ? classroomId : $"classroom:{classroomId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        }
    }

    public async Task SendChatMessage(string target, string message)
    {
        if (string.IsNullOrWhiteSpace(target) || string.IsNullOrWhiteSpace(message))
        {
            return;
        }

        var groupName = target.StartsWith("classroom:") || target.StartsWith("user:") || target.StartsWith("conversation:")
            ? target
            : $"classroom:{target}";

        var senderId = Context.UserIdentifier ?? Context.User?.Identity?.Name ?? Context.ConnectionId;

        await Clients.Group(groupName).SendAsync("ReceiveMessage", new
        {
            SenderId = senderId,
            Target = groupName,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task JoinGroup(string groupName)
    {
        if (!string.IsNullOrWhiteSpace(groupName))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }
    }

    public async Task LeaveGroup(string groupName)
    {
        if (!string.IsNullOrWhiteSpace(groupName))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }
    }
}
