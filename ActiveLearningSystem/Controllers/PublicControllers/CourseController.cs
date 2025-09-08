

﻿using ActiveLearningSystem.Services.PublicServices;

using ActiveLearningSystem.ViewModel;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.PublicControllers
{
    [Route("api/course")]
    [ApiController]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }
        //lấy tất cả khóa học
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
        // Lấy chi tiết khóa học
        [HttpGet("detail/{courseId}")]
        public IActionResult GetCourseDetail(int courseId)
        {
            var course = _courseService.GetCourseDetail(courseId);
            if (course == null)
                return NotFound(new { message = "Không tìm thấy khóa học." });

            return Ok(course);
        }
    }
}
