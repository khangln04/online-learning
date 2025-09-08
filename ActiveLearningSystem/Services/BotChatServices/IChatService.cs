namespace ActiveLearningSystem.Services.BotChatServices
{
    public interface IChatService
    {
        Task<string> SendMessageAsync(string message);
    }

}
