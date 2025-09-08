using ActiveLearningSystem.ViewModel.PupilviewModels;
namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class CourseProgressDetailVM
    {
        public int Id { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? LastAccess { get; set; }
        public string Status { get; set; } = null!;
        public List<ModuleProgressVM> Modules { get; set; } = new();
    }

}
