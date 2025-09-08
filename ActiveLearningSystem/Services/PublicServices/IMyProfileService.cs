using ActiveLearningSystem.ViewModel.PublicViewModels;

namespace ActiveLearningSystem.Services.PublicServices
{
    public interface IMyProfileService
    {
        Task<MyProfileVM> GetMyProfileAsync(int userId);
        Task<bool> LinkAccountAsync(int currentUserId, LinkAccountVM vm);
        Task<bool> UpdateMyProfileAsync(int userId, EditMyProfileVM vm, string? avatarPath);

    }
}
