using ActiveLearningSystem.Services.PupilSerivces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.PupilController
{
    [Route("api/[controller]")]
    [ApiController]
    public class LessonController : ControllerBase
    {
        private readonly ILessonService _lessonService;

        public LessonController(ILessonService lessonService)
        {
            _lessonService = lessonService;
        }
        [Authorize(Roles = "Pupil")]

        [HttpGet("module/{moduleId}")]
        public async Task<IActionResult> GetByModule(int moduleId)
        {
            var lessons = await _lessonService.GetLessonsByModuleIdAsync(moduleId);
            return Ok(lessons);
        }

        [Authorize(Roles = "Pupil")]
        [HttpGet("{lessonId}")]
        public async Task<IActionResult> GetById(int lessonId)
        {
            var lesson = await _lessonService.GetLessonDetailByIdAsync(lessonId);
            if (lesson == null) return NotFound();

            return Ok(lesson);
        }
    }
}