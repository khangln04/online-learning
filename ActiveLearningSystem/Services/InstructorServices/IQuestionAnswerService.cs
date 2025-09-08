using ActiveLearningSystem.ViewModel.InstructorViewModels;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public interface IQuestionAnswerService
    {
        (List<QuestionListVM> Questions, int TotalRecords, int TotalPages) GetQuestions(
            int pageIndex = 1,
            string? keyword = null,
            int? topicId = null,
            int pageSize = 10);

        QuestionListVM? GetQuestionDetail(int questionId);

        Task<bool> AddQuestionAsync(QuestionCreateVM questionVM, List<AnswerCreateVM> answerVMs);

        Task<bool> UpdateQuestionAsync(int questionId, QuestionCreateVM questionVM, List<AnswerCreateVM> answerVMs);

        Task<bool> DeleteQuestionAsync(int questionId);
    }
}
