    using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Services.MarketerServices;
using ActiveLearningSystem.ViewModel;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ActiveLearningSystem.Controllers.MarketerController
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManageBlogController : ControllerBase
    {
        private readonly IBlogListService _blogService;

        public ManageBlogController(IBlogListService blogService)
        {
            _blogService = blogService;
        }

        [Authorize(Roles = "Marketer")]
        [HttpPut("UpdateBlog/{blogId}")]
        public async Task<IActionResult> UpdateBlog(int blogId, [FromForm] BlogUpdateVM blogVM, IFormFile? thumbnail)
        {
            try
            {
                var accountId = JwtClaimHelper.GetAccountId(User);
                var result = await _blogService.UpdateBlogAsync(blogId, blogVM, thumbnail, accountId);
                return Ok("Blog updated successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [Authorize(Roles = "Marketer")]
        [HttpPost("AddBlog")]
        public async Task<IActionResult> CreateBlog([FromForm] BlogCreateVM blogVM, IFormFile thumbnail)
        {
            try
            {
                var accountId = JwtClaimHelper.GetAccountId(User);
                var result = await _blogService.CreateBlogAsync(blogVM, thumbnail, accountId);
                return Ok("Blog created successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [Authorize(Roles = "Marketer")]
        [HttpDelete("DeleteBlog/{blogId}")]
        public async Task<IActionResult> DeleteBlog(int blogId)
        {
            try
            {
                var result = await _blogService.DeleteBlogAsync(blogId);
                return Ok("Blog deleted successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Marketer")]
        [HttpGet("GetAll")]
        public IActionResult GetAllBlogs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10,
                                         [FromQuery] string searchTerm = null, [FromQuery] string sortOrder = "newest")
        {
            try
            {
                var blogs = _blogService.GetAllBlog(pageNumber, pageSize, searchTerm, sortOrder);
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Marketer")]
        [HttpGet("BlogDetail/{blogId}")]
        public IActionResult GetBlogDetail(int blogId)
        {
            try
            {
                var blog = _blogService.GetBlogDetail(blogId);
                return Ok(blog);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Marketer")]
        [HttpGet("summaries")]
        public IActionResult GetActiveBlogSummaries()
        {
            try
            {
                var summaries = _blogService.GetActiveBlogSummaries();
                return Ok(summaries);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        
    }
}
