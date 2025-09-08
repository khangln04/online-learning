using ActiveLearningSystem.ViewModel.ManagerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;

namespace ActiveLearningSystem.Services.PublicServices
{
    public interface ICourseService
    {
        (List<CourseVM> Courses, int TotalRecords, int TotalPages) GetCourses(
                  int pageIndex = 1,
                  string? keyword = null,
                  string? className = null,
                  string? categoryName = null,
                  int pageSize = 5);
        CourseVM? GetCourseDetail(int courseId);
    }
}
