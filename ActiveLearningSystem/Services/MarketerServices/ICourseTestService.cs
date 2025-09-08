using ActiveLearningSystem.ViewModel.PublicViewModels;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public interface ICourseTestService
    {
        (List<CourseVM> Courses, int TotalRecords, int TotalPages) GetCourses(
            int pageIndex = 1,
            string? keyword = null,
            string? className = null,
            string? categoryName = null,
            int pageSize = 5);

        CourseVM? GetCourseDetail(int courseId);

        Task<List<QuestionWithAnswersVM>> GetQuestionsByQuizzIdAsync(int quizzId);
    }
}
