// File: Services/StatServices/IStat.cs
using ActiveLearningSystem.ViewModel.MaketerViewModels;

namespace ActiveLearningSystem.Services.StatServices
{
    public interface IStat
    {
        Task<DashboardVM> GetDashboardAsync();
        Task<CourseDetailVM?> GetCourseDetailAsync(int courseId);
        // ✅ Thêm feedback
        Task<ServiceResultVM> AddFeedbackAsync(int courseId, int userId, int rate, string content);
        Task<List<AddFeedbackVM>> GetFeedbacksByCourseAsync(int courseId);
    }
}
