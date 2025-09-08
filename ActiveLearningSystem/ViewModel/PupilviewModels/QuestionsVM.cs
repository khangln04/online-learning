using ActiveLearningSystem.Model;

namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class QuestionsVM
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public List<AnswerVM> Answers { get; set; }
    }
}
