using ActiveLearningSystem.ViewModel.PupilviewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels.QuizzViewModels;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Services.PupilServices
{
    public interface IQuizzService
    {
        Task<QuizzVM> GetQuizzInfo(int quizzId);
        Task<List<TopicVM>> GetAllTopics(int quizzId);
        Task<List<QuestionsVM>> GetQuestionsByQuizz(int moduleProgressId);
        Task<UserQuizzVM> CreateUserQuiz(int moduleProgressId);
        Task<UserQuizzVM> GetUserQuiz(int moduleProgressId);
        Task UpdateUserAnswers(int userQuizId, UpdateUserAnswersDTO updateData);
        Task EvaluateQuiz(int userQuizId);
    }
}
