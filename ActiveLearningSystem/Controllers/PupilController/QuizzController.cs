using ActiveLearningSystem.Services.PupilServices;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels.QuizzViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Controllers.PupilController
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuizController : ControllerBase
    {
        private readonly IQuizzService _service;

        public QuizController(IQuizzService service)
        {
            _service = service;
        }
        [Authorize(Roles = "Pupil")]
        [HttpGet("{quizzId}")]
        public async Task<ActionResult<QuizzVM>> GetQuizzInfo(int quizzId)
        {
            var quizInfo = await _service.GetQuizzInfo(quizzId);
            if (quizInfo == null)
            {
                return NotFound("Không tìm thấy bài kiểm tra.");
            }

            return Ok(quizInfo);
        }
        [Authorize(Roles = "Pupil")]
        [HttpGet("{quizzId}/topics")]
        public async Task<ActionResult<List<TopicVM>>> GetAllTopics(int quizzId)
        {
            var topics = await _service.GetAllTopics(quizzId);
            if (topics == null || !topics.Any())
            {
                return NotFound("Không tìm thấy topic nào.");
            }

            return Ok(topics);
        }
        //[Authorize(Roles = "Pupil")]
        //[HttpGet("questions/{moduleProgressId}")]
        //public async Task<ActionResult<List<QuestionsVM>>> GetQuestions(int moduleProgressId)
        //{
        //    var questions = await _service.GetQuestionsByQuizz(moduleProgressId);
        //    if (questions == null || !questions.Any())
        //    {
        //        return NotFound("Không tìm thấy câu hỏi nào.");
        //    }

        //    return Ok(questions);
        //}
        //[Authorize(Roles = "Pupil")]
        //[HttpPost("user-quiz/{moduleProgressId}")]
        //public async Task<ActionResult<UserQuizzVM>> CreateUserQuiz(int moduleProgressId)
        //{
        //    try
        //    {
        //        var userQuiz = await _service.CreateUserQuiz(moduleProgressId);
        //        return CreatedAtAction(nameof(GetUserQuiz), new { moduleProgressId }, userQuiz);
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest(new { message = ex.Message });
        //    }
        //}
        //[Authorize(Roles = "Pupil")]

        //[HttpGet("user-quiz/{moduleProgressId}")]
        //public async Task<ActionResult<UserQuizzVM>> GetUserQuiz(int moduleProgressId)
        //{
        //    var userQuiz = await _service.GetUserQuiz(moduleProgressId);
        //    if (userQuiz == null)
        //    {
        //        return NotFound("Không tìm thấy bài kiểm tra cho người dùng này.");
        //    }

        //    return Ok(userQuiz);
        //}
        //[Authorize(Roles = "Pupil")]
        //[HttpPut("user-quiz/{userQuizId}/answers")]
        //public async Task<IActionResult> UpdateUserAnswers(int userQuizId, [FromBody] UpdateUserAnswersDTO updateData)
        //{
        //    if (updateData == null || updateData.Answers == null || !updateData.Answers.Any())
        //    {
        //        return BadRequest("Dữ liệu không hợp lệ.");
        //    }

        //    await _service.UpdateUserAnswers(userQuizId, updateData);
        //    return NoContent(); // Trả về 204 No Content nếu thành công
        //}
        //[Authorize(Roles = "Pupil")]
        //[HttpPost("user-quiz/{userQuizId}/evaluate")]
        //public async Task<IActionResult> EvaluateQuiz(int userQuizId)
        //{
        //    await _service.EvaluateQuiz(userQuizId);
        //    return NoContent(); // Trả về 204 No Content nếu thành công
        //}
    }
}
