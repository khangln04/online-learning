namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class QuizzCreateVM
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public int QuestionCount { get; set; }
        public int TimeLimit { get; set; }
        public double RequiredScore { get; set; }
        public int ModuleId { get; set; }
        public bool Status { get; set; } // Mặc định có thể là true
    }
}
