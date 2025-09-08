using ActiveLearningSystem.ViewModel.PupilViewModels;

namespace ActiveLearningSystem.Services.PupilSerivces
{
    public interface ILessonService
    {
        Task<List<LessonVM>> GetLessonsByModuleIdAsync(int moduleId);
        Task<LessonVM?> GetLessonDetailByIdAsync(int lessonId);
    }

}
