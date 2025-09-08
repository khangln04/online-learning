using ActiveLearningSystem.ViewModel.PublicViewModels;

namespace ActiveLearningSystem.Services.PublicServices
{
    public interface IPublicService
    {
        List<BannerVM> GetActiveBanner();
        List<FeedbackVM> GetAllFeedbacks();
    }
}
