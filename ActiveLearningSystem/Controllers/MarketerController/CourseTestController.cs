using ActiveLearningSystem.Services.MarketerServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.MarketerController
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseTestController : ControllerBase
    {
        private readonly ICourseTestService _courseService;

        public CourseTestController(ICourseTestService courseService)
        {
            _courseService = courseService;
        }
        [Authorize(Roles = "Marketer, Manager, Instructor")]
        [HttpGet("all")]
        public IActionResult GetCourses(
           int pageIndex = 1,
           string? keyword = null,
           string? className = null,
           string? categoryName = null,
           int pageSize = 5)
        {
            try
            {
                var result = _courseService.GetCourses(pageIndex, keyword, className, categoryName, pageSize);
                return Ok(new
                {
                    Data = result.Courses,
                    TotalRecords = result.TotalRecords,
                    TotalPages = result.TotalPages
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách khóa học: " + ex.Message });
            }
        }
        [Authorize(Roles = "Marketer, Manager, Instructor")]
        [HttpGet("detail/{courseId}")]
        public IActionResult GetCourseDetail(int courseId)
        {
            var course = _courseService.GetCourseDetail(courseId);
            if (course == null)
                return NotFound(new { message = "Không tìm thấy khóa học." });

            return Ok(course);
        }

        // ----- Thêm action lấy câu hỏi kèm câu trả lời theo QuizzId -----
        [Authorize(Roles = "Marketer, Manager, Instructor")]
        [HttpGet("quizz/{quizzId}/questions")]
        public async Task<IActionResult> GetQuestionsByQuizzId(int quizzId)
        {
            try
            {
                var questions = await _courseService.GetQuestionsByQuizzIdAsync(quizzId);

                if (questions == null || questions.Count == 0)
                    return NotFound(new { message = "Không tìm thấy câu hỏi cho quizz này." });

                return Ok(questions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy câu hỏi: " + ex.Message });
            }
        }
    }
}
