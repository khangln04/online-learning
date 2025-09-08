using ActiveLearningSystem.ViewModel.PupilviewModels;

namespace ActiveLearningSystem.ViewModel.ParentViewModels
{
    public class PupilCourseGroupVM
    {
        public int PupilUserId { get; set; }
        public string PupilName { get; set; }
        public string? Avatar { get; set; }
        public List<CourseOverviewVM> Courses { get; set; } = new();
    }
}
