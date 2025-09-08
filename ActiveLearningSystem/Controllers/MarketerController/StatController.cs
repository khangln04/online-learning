// File: Controllers/StatController.cs
using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Services.StatServices;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatController : ControllerBase
    {
        private readonly IStat _statService;

        public StatController(IStat statService)
        {
            _statService = statService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var result = await _statService.GetDashboardAsync();
            return Ok(result);
        }

        [HttpGet("course-detail/{courseId}")]
        public async Task<IActionResult> GetCourseDetail(int courseId)
        {
            var result = await _statService.GetCourseDetailAsync(courseId);
            if (result == null) return NotFound("Course not found");
            return Ok(result);
        }

        // ✅ Thêm feedback (chỉ cho user đã đăng nhập và thanh toán)
        [Authorize]
        [HttpPost("feedback")]
        public async Task<IActionResult> AddFeedback([FromBody] CreateFeedbackVM model)
        {
            var userId = JwtClaimHelper.GetAccountId(User);

            var result = await _statService.AddFeedbackAsync(model.CourseId, userId, model.Rate, model.Content);

            if (result.Success)
                return Ok(result.Message);

            return BadRequest(result.Message);
        }

        // ✅ Lấy feedback theo course
        [HttpGet("feedback/{courseId}")]
        public async Task<IActionResult> GetFeedbacksByCourse(int courseId)
        {
            var feedbacks = await _statService.GetFeedbacksByCourseAsync(courseId);
            return Ok(feedbacks);
        }
    }
}

