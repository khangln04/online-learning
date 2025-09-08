using ActiveLearningSystem.ViewModel.PupilviewModels;

namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class QuestionWithAnswersVM
    {
        public int Id { get; set; }
        public string? Content { get; set; }
        public int TopicId { get; set; }
        public List<AnswerVM> Answers { get; set; } = new List<AnswerVM>();
    }
    //    public class AnswerTestVM
    //    {
    //        public int Id { get; set; }
    //        public string Content { get; set; } = null!;
    //        public bool IsCorrect { get; set; }
    //    }
    //}
}
