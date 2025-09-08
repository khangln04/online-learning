using ActiveLearningSystem.Services;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.Services.MarketerServices;
using ActiveLearningSystem.Services.PublicServices;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.PublicControllers
{
    [Route("api/homepage")]
    [ApiController]
    public class HomepageController : ControllerBase
    {
        private readonly ICourseListService _courseService;
        private readonly IPublicService _publicService;
        private readonly IBlogListService _blogService;
        public HomepageController(ICourseListService courseService, IPublicService publicService, IBlogListService blogService)
        {
            _courseService = courseService;
            _publicService = publicService;
            _blogService = blogService;
        }

        [HttpGet("courses")]
        public IActionResult GetActiveCourse()
        {
            var result = _courseService.GetAllCourses()
        .Where(c => c.Status)
        .OrderByDescending(b => b.CreatedDate)
        .Select(c => new
        {
            c.CourseId,
            c.CourseName,
            c.Description,
            c.CategoryName,
            c.Image,
            c.Price,
            c.AuthorName,
            c.CreatedDate
        })
        .ToList();

            return Ok(result);
        }

        [HttpGet("banners")]
        public IActionResult GetActiveBanners()
        {
            var result = _publicService.GetActiveBanner()
                .Select(b => new
                {
                    b.Thumbnail,
                })
                .ToList();

            return Ok(result);
        }

        [HttpGet("blogs")]
        public IActionResult GetActiveBlogs()
        {
            var result = _blogService.GetActiveBlogSummaries();
            return Ok(result);
        }

        [HttpGet("feedbacks")]
        public IActionResult GetFeedbacks()
        {
            var feedbacks = _publicService.GetAllFeedbacks();
            return Ok(feedbacks);
        }
    }
}
