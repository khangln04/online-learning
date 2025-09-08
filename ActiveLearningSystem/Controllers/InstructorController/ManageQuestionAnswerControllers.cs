using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.InstructorController
{
    [Route("api/ManageQuestion")]
    [ApiController]
    public class ManageQuestionAnswerControllers : ControllerBase
    {
        private readonly IQuestionAnswerService _iService;

        public ManageQuestionAnswerControllers(IQuestionAnswerService iService)
        {
            _iService = iService;
        }
        [Authorize(Roles = "Instructor")]
        [HttpGet("all")]
        public IActionResult GetQuestion(int pageIndex = 1,
               string? keyword = null,
               int? topicId = null,
               int pageSize = 10)
        {
            try
            {
                var result = _iService.GetQuestions(pageIndex, keyword, topicId, pageSize);
                return Ok(new
                {
                    Data = result.Questions,
                    TotalRecords = result.TotalRecords,
                    TotalPages = result.TotalPages
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách câu hỏi: " + ex.Message });
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpGet("detail/{id}")]
        public IActionResult GetQuestionDetail(int id)
        {
            try
            {
                var questionDetail = _iService.GetQuestionDetail(id);
                if (questionDetail == null)
                {
                    return NotFound(new { message = "Không tìm thấy câu hỏi với ID = " + id });
                }

                return Ok(new { Data = questionDetail });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy chi tiết câu hỏi: " + ex.Message });
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPost("add")]
        public async Task<IActionResult> AddQuestion([FromBody] QuestionWithAnswersVM model)
        {
            try
            {
                var success = await _iService.AddQuestionAsync(model.Question, model.Answers);
                return Ok(new { message = "✅ Thêm câu hỏi thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "❌ " + ex.Message });
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] QuestionWithAnswersVM model)
        {
            try
            {
                var success = await _iService.UpdateQuestionAsync(id, model.Question, model.Answers);
                return Ok(new { message = "✅ Cập nhật câu hỏi thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "❌ " + ex.Message });
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            try
            {
                var success = await _iService.DeleteQuestionAsync(id);
                return Ok(new { message = " Xóa câu hỏi thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "❌ " + ex.Message });
            }
        }
    }
}
