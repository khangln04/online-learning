using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Services.PupilSerivces;
using ActiveLearningSystem.Services.PupilServices;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using ActiveLearningSystem.ViewModel.PupilViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.PupilController
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseProgressController : ControllerBase
    {
        private readonly ICourseProgressService _service;
        private readonly IQuizzService _quizzService;

        public CourseProgressController(ICourseProgressService service, IQuizzService quizzService)
        {
            _service = service;
            _quizzService = quizzService;
        }

        [Authorize(Roles = "Parent,Pupil")]
        [HttpGet("MyCourseList")]
        public async Task<IActionResult> GetCoursesByStudent()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            var role = JwtClaimHelper.GetRole(User); // nếu bạn đã lưu Role trong JWT

            var result = await _service.GetCoursesByStudentAsync(accountId);

            if (result == null || result.Count == 0)
            {
                if (role == "Parent")
                    return NotFound("Phụ huynh chưa liên kết học sinh hoặc học sinh chưa có khóa học.");
                else
                    return NotFound("Không tìm thấy khóa học cho học sinh.");
            }

            return Ok(result);
        }


        [Authorize(Roles = "Parent,Pupil")]
        [HttpGet("CompletedCourseList")]
        public async Task<IActionResult> GetCompletedCoursesByStudent()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            var role = JwtClaimHelper.GetRole(User);

            var result = await _service.GetCompletedCoursesByStudentAsync(accountId);

            if (result == null || result.Count == 0)
            {
                if (role == "Parent")
                    return NotFound("Phụ huynh chưa liên kết học sinh hoặc học sinh chưa hoàn thành khóa học nào.");
                else
                    return NotFound("Học sinh chưa hoàn thành khóa học nào.");
            }

            return Ok(result);
        }


        [Authorize(Roles = "Parent,Pupil")]
        [HttpGet("student-course/{courseStudentId}/progress")]
        public async Task<IActionResult> GetCourseProgressDetail(int courseStudentId)
        {
            var accountId = JwtClaimHelper.GetAccountId(User);

            if (await _service.CheckInfo(courseStudentId,accountId)== true)
            {
                var result = await _service.GetCourseProgressDetailAsync(courseStudentId);
                if (result == null)
                    return NotFound("Không tìm thấy tiến độ học.");
                return Ok(result);
            }
           return BadRequest();
        }

        [Authorize(Roles = "Pupil")]
        [HttpGet("CourseList")]
        public async Task<IActionResult> GetCoursesStudent()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);

            var result = await _service.GetCoursesByStudent(accountId);
            return Ok(result);
        }

        [Authorize(Roles = "Pupil")]
        [HttpGet("get-completion/{studentCourseId}")]
        public async Task<IActionResult> GetCompletion(int studentCourseId)
        {
            var result = await _service.GetCourseCompletionAsync(studentCourseId);
            if (result == null)
                return NotFound("Không tìm thấy tiến trình khóa học!");
            return Ok(result);
        }

        [Authorize(Roles = "Pupil")]
        [HttpPost("user-quiz/{moduleProgressId}")]
        public async Task<ActionResult<UserQuizzVM>> CreateUserQuiz(int moduleProgressId)
        {
            try
            {
                var userQuiz = await _quizzService.CreateUserQuiz(moduleProgressId);
                return CreatedAtAction(nameof(GetUserQuiz), new { moduleProgressId }, userQuiz);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Pupil")]
        [HttpPut("user-quiz/{userQuizId}/answers")]
        public async Task<IActionResult> UpdateUserAnswers(int userQuizId, [FromBody] UpdateUserAnswersDTO updateData)
        {
            if (updateData == null || updateData.Answers == null || !updateData.Answers.Any())
            {
                return BadRequest("Dữ liệu không hợp lệ.");
            }

            await _quizzService.UpdateUserAnswers(userQuizId, updateData);
            return NoContent(); // Trả về 204 No Content nếu thành công
        }

        [Authorize(Roles = "Pupil")]
        [HttpPost("InsertCourseProgress")]
        public async Task<IActionResult> InsertOrUpdate([FromBody] CourseProgressCreateVM model)
        {
            var success = await _service.InsertOrUpdateCourseProgressAsync(model);

            if (success)
                return Ok(new { message = "Cập nhật CourseProgress thành công" });

            return BadRequest(new { message = "Cập nhật CourseProgress thất bại" });
        }

        [Authorize(Roles = "Pupil")]
        [HttpGet("user-quiz/{moduleProgressId}")]
        public async Task<ActionResult<UserQuizzVM>> GetUserQuiz(int moduleProgressId)
        {
            var userQuiz = await _quizzService.GetUserQuiz(moduleProgressId);
            if (userQuiz == null)
            {
                return NotFound("Không tìm thấy bài kiểm tra cho người dùng này.");
            }

            return Ok(userQuiz);
        }

        [Authorize(Roles = "Pupil")]
        [HttpPost("InsertModuleProgress")]
        public async Task<IActionResult> InsertOrUpdate([FromBody] ModuleProgressCreateVM model)
        {
            var success = await _service.InsertOrUpdateModuleProgressAsync(model);

            if (success)
                return Ok(new { message = "Cập nhật ModuleProgress thành công" });

            return BadRequest(new { message = "Cập nhật ModuleProgress thất bại" });
        }

        [Authorize(Roles = "Pupil")]
        [HttpPost("InsertLessonProgress")]
        public async Task<IActionResult> InsertOrUpdate([FromBody] LessonProgressCreateVM model)
        {
            var success = await _service.InsertOrUpdateLessonProgressAsync(model);

            if (success)
                return Ok(new { message = "Cập nhật LessonProgress thành công" });

            return BadRequest(new { message = "Cập nhật LessonProgress thất bại" });
        }

        [Authorize(Roles = "Pupil")]
        [HttpPost("CheckProgress/{studentCourseId}")]
        public async Task<IActionResult> CheckProgress(int studentCourseId)
        {
            var success = await _service.CheckLearningProgressAsync(studentCourseId);

            if (success)
                return Ok(new { message = "Cập nhật tiến trình học thành công." });

            return NotFound(new { message = "Không tìm thấy CourseProgress cho StudentCourseId này." });
        }

        [Authorize]
        [HttpPost("update-watch-status")]
        public async Task<IActionResult> UpdateWatchStatus([FromBody] LessonWatchUpdateVM vm)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _service.UpdateLessonWatchStatusAsync(vm);
            if (!result)
                return NotFound("LessonProgress không tồn tại hoặc dữ liệu không hợp lệ.");

            return Ok(new { message = "Cập nhật trạng thái xem bài học thành công." });
        }
    }
}