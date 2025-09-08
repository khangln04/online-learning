using ActiveLearningSystem.ViewModel.PupilViewModels;

namespace ActiveLearningSystem.Services.PupilSerivces
{
    public interface IRegisterCourseService
    {
        Task<int?> RegisterCourseAsync(int pupilId, int courseId);
    }
}
