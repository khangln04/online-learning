namespace ActiveLearningSystem.ViewModel.PupilviewModels.QuizzViewModels
{
    public class QuestionVM
    {
        public int QuestionId { get; set; }
        public string Content { get; set; }
        public List<AnswerVM> Answers { get; set; }
    }
}
