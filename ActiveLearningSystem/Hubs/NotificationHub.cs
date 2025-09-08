using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinReportGroup(int reportId)
        {
            try
            {
                Console.WriteLine($"🎯 User {Context.UserIdentifier} joining Report_{reportId}");
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Report_{reportId}");
                Console.WriteLine($"✅ User {Context.UserIdentifier} joined Report_{reportId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error joining Report_{reportId}: {ex.Message}");
                throw;
            }
        }

        public async Task JoinUserGroup(int userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }

        public async Task LeaveReportGroup(int reportId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Report_{reportId}");
        }
    }
}