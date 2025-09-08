namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class UserQuizzVM
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public DateTime StartAt { get; set; }
        public List<QuestionsVM> Questions { get; set; }
        public int QuestionCount { get; set; }
    }
}
