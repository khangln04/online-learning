using System.Security.Claims;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.ViewModel;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Controllers.PublicControllers
{
    [Route("api/blog")]
    [ApiController]
    public class BlogController : ControllerBase
    {
        private readonly AlsContext _context;
        private readonly IBlogService _blogService;

        public BlogController(AlsContext context, IBlogService blogService)
        {
            _context = context;
            _blogService = blogService;
        }

        [HttpGet("all")]
        public IActionResult GetAllBlogs(int pageNumber = 1, int pageSize = 5, string searchTerm = null, string sortOrder = "desc")
        {
            var blogs = _blogService.GetAllBlog(pageNumber, pageSize, searchTerm, sortOrder);
            return Ok(blogs);
        }

        [HttpGet("top3new")]
        public IActionResult Get3New()
        {
            var blogs = _blogService.GetTop3NewestBlogs();
            return Ok(blogs);
        }

        [HttpGet("{blogId}")]
        public IActionResult GetBlogDetail(int blogId)
        {
            var blogDetails = _blogService.GetBlogDetail(blogId);
            if (blogDetails == null)
            {
                return NotFound();
            }
            return Ok(blogDetails);
        }

        [Authorize]
        [HttpPost("{blogId}/comments")]
        public async Task<IActionResult> AddComment(int blogId, [FromBody] CommentCreateVM model)
        {
            var userIdClaim = User.FindFirst("id");
            if (userIdClaim == null)
                return Unauthorized("Không tìm thấy thông tin đăng nhập.");

            int accountId = int.Parse(userIdClaim.Value);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null)
                return BadRequest("Không tìm thấy thông tin hồ sơ học sinh.");

            var result = await _blogService.AddCommentAsync(blogId, profile.UserId, model.Content);
            if (!result)
                return NotFound("Không tìm thấy bài viết.");

            return Ok("Thêm bình luận thành công.");
        }


    }
}
