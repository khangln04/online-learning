using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.PublicViewModels;

namespace ActiveLearningSystem.ViewModel
{
    public class ModuleVM
    {
        public int Id { get; set; }

        public string ModuleName { get; set; } = null!;

        public string Description { get; set; } = null!;

        public int ModuleNum { get; set; }

        public bool Status { get; set; }
        public int CourseId {  get; set; }
        public String CourseName { get; set; }

        public List<LessonViewVM> Lessons { get; set; }
        public List<QuizzViewVM> Quizzs { get; set; }
    }
}
