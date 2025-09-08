using ActiveLearningSystem.Model;

namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class ModuleProgressVM
    {
        public int ModuleId { get; set; }
        public string ModuleName { get; set; } = null!;
        public bool Status { get; set; }
        public DateOnly? StartDate { get; set; }

        public DateOnly? LastAccess { get; set; }
        public List<LessonProgressVM> Lessons { get; set; } = new();
        public List<QuizzProgressVM> Quizzs { get; set; } = new();
    }

}
