using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using Microsoft.AspNetCore.Http;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public interface ICourseListService
    {
        List<CourseVM> GetAllCourses();

        (List<CourseVM> Courses, int TotalRecords, int TotalPages) GetCourses(
            int pageIndex = 1,
            string? keyword = null,
            string? className = null,
            string? categoryName = null,
            int pageSize = 5);
        Task<(List<CourseVM> Courses, int TotalRecords, int TotalPages)> GetCoursesById(
            int accountId,
            int pageIndex = 1,
            string? keyword = null,
            string? className = null,
            string? categoryName = null,
            int pageSize = 5);

        Task<bool> CreateCourseAsync(CourseCreateVM courseVM, IFormFile image, int accountId);

        CourseVM? GetCourseDetail(int courseId);

        Task<bool> UpdateCourseAsync(int courseId, CourseUpdateVM courseVM, IFormFile image, int accountId);

        Task<bool> SetCourseStatusAsync(int courseId, bool newStatus);

        List<ClassVM> GetClassDropdown();

        List<CategoryVM> GetCategoryDropdown();
    }
}
