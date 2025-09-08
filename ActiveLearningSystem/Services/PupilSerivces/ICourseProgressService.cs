using ActiveLearningSystem.ViewModel.PupilviewModels;
using ActiveLearningSystem.ViewModel.PupilViewModels;

namespace ActiveLearningSystem.Services.PupilSerivces
{
    public interface ICourseProgressService
    {
        Task<List<CourseOverviewVM>> GetCoursesByStudentAsync(int accountId);
        Task<CourseProgressDetailVM?> GetCourseProgressDetailAsync(int courseStudentId);
        Task<List<CourseOverviewVM>> GetCompletedCoursesByStudentAsync(int accountId);
        Task<List<CourseOverviewVM>> GetCoursesByStudent(int accountId);
        Task<bool> InsertOrUpdateCourseProgressAsync(CourseProgressCreateVM model);
        Task<bool> InsertOrUpdateModuleProgressAsync(ModuleProgressCreateVM model);
        Task<bool> InsertOrUpdateLessonProgressAsync(LessonProgressCreateVM model);
        Task<CourseCompletionVM?> GetCourseCompletionAsync(int studentCourseId);
        Task<bool> CheckLearningProgressAsync(int studentCourseId);
        Task<bool> UpdateLessonWatchStatusAsync(LessonWatchUpdateVM vm);
        Task<bool> CheckInfo(int courseStudentId, int accountId);
    }
}
