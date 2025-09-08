namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class UserAnswerVM
    {
        public int QuestionId { get; set; }
        public int? AnswerId { get; set; }
        public DateTime? AnswerAt { get; set; }
        public bool? IsCorrect { get; set; }

    }
}
