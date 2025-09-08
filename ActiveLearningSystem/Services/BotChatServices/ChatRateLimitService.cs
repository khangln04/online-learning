//using Microsoft.Extensions.Caching.Memory;

//namespace ActiveLearningSystem.Services.BotChatServices
//{
//    public class ChatRateLimitService : IChatRateLimitService
//    {
//        private readonly IMemoryCache _cache;

//        public ChatRateLimitService(IMemoryCache cache)
//        {
//            _cache = cache;
//        }

//        public bool CanSendPrompt(int accountId)
//        {
//            var today = DateTime.UtcNow.Date;
//            var cacheKey = $"chat_limit_{accountId}_{today:yyyyMMdd}";

//            int count = _cache.GetOrCreate(cacheKey, entry =>
//            {
//                entry.AbsoluteExpiration = today.AddDays(1); // reset sau 24h
//                return 0;
//            });

//            if (count >= 3)
//                return false;

//            _cache.Set(cacheKey, count + 1);
//            return true;
//        }
//    }
//}
