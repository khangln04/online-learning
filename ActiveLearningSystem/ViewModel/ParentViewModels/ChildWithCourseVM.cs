using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;

public class ChildWithCoursesVM
{
    public MyProfileVM Child { get; set; }
    public List<CourseOverviewVM> Courses { get; set; }
}