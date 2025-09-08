using ActiveLearningSystem.ViewModel.ParentViewModels;

namespace ActiveLearningSystem.Services.ParentServices
{
    public interface IPaidCourseHistoryService
    {
        Task<List<PaidCourseHistoryVM>> GetUnpaidHistoryForParentAsync(int parentUserId);
        Task<List<PaidCourseHistoryVM>> GetPaidHistoryForParentAsync(int parentUserId);
    }
}
