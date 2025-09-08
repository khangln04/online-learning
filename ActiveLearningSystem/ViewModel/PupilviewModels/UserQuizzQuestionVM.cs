namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class UserQuizzQuestionVM
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public string Content { get; set; }
        public List<AnswerVM> Answers { get; set; }
    }
}
