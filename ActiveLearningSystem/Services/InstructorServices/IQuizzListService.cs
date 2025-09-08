using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
namespace ActiveLearningSystem.Services.InstructorServices
{
    public interface IQuizzListService
    {
        List<QuizzManageVM> GetQuizzByModuleId(int moduleId);
        List<QuizzManageVM> GetQuizzList();
        void CreateQuizz(QuizzCreateVM quizzCreateVM);
        void UpdateQuizz(int quizzId, UpdateQuizzVM quizzUpdateVM);
        void UpdateTopicsOfQuizz(int quizzId, List<int> newTopicIds); // Cập nhật các topic cho quizz
        QuizzManageVM GetQuizzById(int id);
        List<TopicVM> GetTopicDropdown(int quizzId);
        void LockUnlockQuizz(int quizzId);

    }
}