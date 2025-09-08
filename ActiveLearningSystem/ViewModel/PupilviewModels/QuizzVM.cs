using ActiveLearningSystem.Model;

namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class QuizzVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public int QuestionCount { get; set; }
        public int TimeLimit { get; set; }
        public DateTime CreateAt { get; set; }
        public int ModuleId { get; set; }
        public string ModuleName { get; set; }
        public double RequiredScore { get; set; }

    }
}