namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class AnswerVM
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public bool IsCorrect { get; set; }
        public char Option { get; set; } // A, B, C, D
    }
}
