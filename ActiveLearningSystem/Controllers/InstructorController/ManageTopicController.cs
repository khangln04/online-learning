using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.InstructorController
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManageTopicController : ControllerBase
    {
        private readonly IManageTopicService _topicService;

        public ManageTopicController(IManageTopicService topicService)
        {
            _topicService = topicService;
        }

        [Authorize(Roles = "Instructor")]
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _topicService.GetAllTopicsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Instructor")]
        [HttpPost("Create")]
        public async Task<IActionResult> Add([FromBody] TopicCreateUpdateVM model)
        {
            await _topicService.CreateTopicAsync(model);
            return Ok("Topic created successfully.");
        }

        [Authorize(Roles = "Instructor")]
        [HttpPut("Update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TopicCreateUpdateVM model)
        {
            var success = await _topicService.UpdateTopicAsync(id, model);
            if (!success)
                return NotFound("Topic not found.");

            return Ok("Topic updated successfully.");
        }

    }
}
