using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Controllers.InstructorController
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManageLessonController : ControllerBase
    {
        private readonly ILessonManageService _lessonManageService;

        public ManageLessonController(ILessonManageService lessonManageService)
        {
            _lessonManageService = lessonManageService;
        }
        [Authorize(Roles = "Instructor")]
        [HttpGet("{moduleId}")]
        public ActionResult<List<LessonViewVM>> GetAllLessons(int moduleId)
        {
            var lessons = _lessonManageService.GetAllVideo(moduleId);
            return Ok(lessons);
        }
        [Authorize(Roles = "Instructor")]
        [HttpPost]
        public async Task<ActionResult> CreateLesson([FromBody] LessonCreateVM lessonCreateVM)
        {
            try
            {
                await _lessonManageService.CreateLessonAsync(lessonCreateVM);
                return CreatedAtAction(nameof(GetAllLessons), new { moduleId = lessonCreateVM.ModuleId }, lessonCreateVM);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpPut("{lessonId}")]
        public async Task<ActionResult> UpdateLesson(int lessonId, [FromBody] LessonUpdateVM lessonUpdateVM)
        {
            try
            {
                await _lessonManageService.UpdateLessonAsync(lessonId, lessonUpdateVM);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [Authorize(Roles = "Instructor")]
        [HttpDelete("{lessonId}")]
        public async Task<ActionResult> DeleteLesson(int lessonId)
        {
            var result = await _lessonManageService.DeleteLessonAsync(lessonId);
            if (!result) return NotFound("Lesson not found.");
            return NoContent();
        }
    }
}