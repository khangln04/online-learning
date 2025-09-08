using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.InstructorController
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManageQuizzController : ControllerBase
    {
        private readonly IQuizzListService _quizzListService;

        public ManageQuizzController(IQuizzListService quizzListService)
        {
            _quizzListService = quizzListService;
        }
        [Authorize(Roles = "Instructor")]
        [HttpGet("quizz/all")]
        public IActionResult GetAllQuizz()
        {
            var quizzes = _quizzListService.GetQuizzList();
            return Ok(quizzes);
        }
        [Authorize(Roles = "Instructor")]
        [HttpGet("quizz/{id}/details")]
        public IActionResult GetQuizzDetails(int id)
        {
            var quizzes = _quizzListService.GetQuizzByModuleId(id);
            return Ok(quizzes);
        }
        [Authorize(Roles = "Instructor")]
        [HttpGet("quizz/{id}")]
        public IActionResult GetQuizzById(int id)
        {
            try
            {
                var quizz = _quizzListService.GetQuizzById(id);
                return Ok(quizz);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPost("quizz/create")]
        public IActionResult CreateQuizz([FromBody] QuizzCreateVM quizzCreateVM)
        {
            try
            {
                _quizzListService.CreateQuizz(quizzCreateVM);
                return CreatedAtAction(nameof(GetQuizzDetails), new { id = quizzCreateVM.ModuleId }, quizzCreateVM);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPut("quizz/update/{quizzId}")]
        public IActionResult UpdateQuizz(int quizzId, [FromBody] UpdateQuizzVM quizzUpdateVM)
        {
            try
            {
                _quizzListService.UpdateQuizz(quizzId, quizzUpdateVM);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPut("quizz/{quizzId}/topics/update")]
        public IActionResult UpdateTopicsOfQuizz(int quizzId, [FromBody] List<int> newTopicIds)
        {
            try
            {
                _quizzListService.UpdateTopicsOfQuizz(quizzId, newTopicIds);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPut("quizz/lockUnlock/{id}")]
        public IActionResult LockUnlockQuizz(int id)
        {
            try
            {
                _quizzListService.LockUnlockQuizz(id);
                return NoContent(); // Return 204 No Content if successful
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message); // Return 400 Bad Request on error
            }
        }

        [HttpGet("topic-class")]
        public IActionResult GetTopicDropdown(int quizzId)
        {
            try
            {
                var classes = _quizzListService.GetTopicDropdown(quizzId);
                return Ok(classes);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }

    }
}