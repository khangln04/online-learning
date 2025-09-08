using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;

namespace ActiveLearningSystem.ViewModel.ParentViewModels
{
    public class ChildProgressDetailVM
    {
        public MyProfileVM Child { get; set; }
        public List<CourseProgressDetailVM> CourseProgressDetails { get; set; }
    }
}
