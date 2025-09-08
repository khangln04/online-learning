using ActiveLearningSystem.ViewModel.ParentViewModels;

namespace ActiveLearningSystem.Services.ParentServices
{
    public interface ICheckProgressServices
    {
        Task<List<PupilCourseGroupVM>> GetCoursesByParentAsync(int accountId);
        Task<List<PupilCourseGroupVM>> GetCompleteCoursesByParentAsync(int accountId);
    }
}
