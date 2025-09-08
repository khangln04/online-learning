using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ActiveLearningSystem.Controllers.InstructorController
{
    [Route("api/manager/course")]
    [ApiController]
    public class ManageCourseController : ControllerBase
    {
        private readonly ICourseListService _courseService;

        public ManageCourseController(ICourseListService courseService)
        {
            _courseService = courseService;
        }
        [Authorize(Roles = "Manager, Marketer")]
        [HttpGet("all")]
        public IActionResult GetCourses(
            int pageIndex = 1,
            string? keyword = null,
            string? className = null,
            string? categoryName = null,
            int pageSize = 5)
        {
            try
            {
                var result = _courseService.GetCourses(pageIndex, keyword, className, categoryName, pageSize);
                return Ok(new
                {
                    Data = result.Courses,
                    TotalRecords = result.TotalRecords,
                    TotalPages = result.TotalPages
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách khóa học: " + ex.Message });
            }
        }

        [Authorize(Roles = "Instructor")]
        [HttpGet("my-courses")]
        public async Task<IActionResult> GetCoursesByAuthor(
     int pageIndex = 1,
     string? keyword = null,
     string? className = null,
     string? categoryName = null,
     int pageSize = 5)
        {
            try
            {
                var accountId = JwtClaimHelper.GetAccountId(User);

                var result = await _courseService.GetCoursesById(accountId, pageIndex, keyword, className, categoryName, pageSize);

                return Ok(new
                {
                    Data = result.Courses,
                    TotalRecords = result.TotalRecords,
                    TotalPages = result.TotalPages
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách khóa học theo giảng viên: " + ex.Message });
            }
        }


        [Authorize(Roles = "Instructor")]
        [HttpPost("add")]
        public async Task<IActionResult> CreateCourse([FromForm] CourseCreateVM courseVM, IFormFile image)
        {
            try
            {
                var accountId = JwtClaimHelper.GetAccountId(User); 
                await _courseService.CreateCourseAsync(courseVM, image, accountId);
                return Ok(new { message = "Tạo khóa học thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Instructor, Marketer")]
        [HttpPut("{courseId}")]
        public async Task<IActionResult> UpdateCourse(int courseId, [FromForm] CourseUpdateVM courseVM, IFormFile? image)
        {
            try
            {
                var accountId = JwtClaimHelper.GetAccountId(User);
                var result = await _courseService.UpdateCourseAsync(courseId, courseVM, image, accountId);
                return Ok("Cập nhật khóa học thành công.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Manager, Instructor, Marketer")]
        [HttpGet("detail/{courseId}")]
        public IActionResult GetCourseDetail(int courseId)
        {
            var course = _courseService.GetCourseDetail(courseId);
            if (course == null)
                return NotFound(new { message = "Không tìm thấy khóa học." });

            return Ok(course);
        }
        [Authorize(Roles = "Manager")]
        [HttpPut("set-status/{courseId}")]
        public async Task<IActionResult> SetCourseStatus(int courseId, [FromQuery] bool status)
        {
            try
            {
                var accountId = JwtClaimHelper.GetAccountId(User);
                await _courseService.SetCourseStatusAsync(courseId, status);
                return Ok(new { message = $"Cập nhật trạng thái khóa học thành công. Status = {(status ? 1 : 0)}" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpGet("list-class")]
        public IActionResult GetClassDropdown()
        {
            try
            {
                var classes = _courseService.GetClassDropdown();
                return Ok(classes);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }

        [HttpGet("list-category")]
        public IActionResult GetCategoryDropdown()
        {
            try
            {
                var cate = _courseService.GetCategoryDropdown();
                return Ok(cate);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }
    }
}
