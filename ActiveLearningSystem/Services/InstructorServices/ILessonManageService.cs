using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public interface ILessonManageService
    {
        List<LessonViewVM> GetAllVideo(int moduleId);
        Task<bool> CreateLessonAsync(LessonCreateVM lessonCreateVM);
        Task<bool> UpdateLessonAsync(int lessonId, LessonUpdateVM lessonUpdateVM);
        Task<bool> DeleteLessonAsync(int lessonId);
    }
}
