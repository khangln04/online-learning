using System.Security.Claims;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.PupilSerivces;
using ActiveLearningSystem.ViewModel.PupilViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Controllers.PupilController
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegisterCourseController : ControllerBase
    {
        private readonly IRegisterCourseService _service;
        private readonly AlsContext _context;

        public RegisterCourseController(IRegisterCourseService service, AlsContext context)
        {
            _service = service;
            _context = context;
        }

        [Authorize(Roles = "Pupil")]
        [HttpPost("register")]
        public async Task<IActionResult> RegisterCourse([FromBody] RegisterCourseVM model)
        {
            var userIdClaim = User.FindFirst("id");
            if (userIdClaim == null)
                return Unauthorized("Không tìm thấy thông tin đăng nhập.");

            int accountId = int.Parse(userIdClaim.Value);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null)
                return BadRequest("Không tìm thấy thông tin hồ sơ học sinh.");

            var result = await _service.RegisterCourseAsync(profile.UserId, model.CourseId);

            if (result == -1)
                return BadRequest("Học sinh đã đăng ký khóa học này.");

            if (result == -2)
                return BadRequest("Khóa học không còn hoạt động.");

            if (result == -3)
                return BadRequest("Vui lòng liên kết với tài khoản phụ huynh để đăng ký khóa học!");

            if (result == null || result <= 0)
                return BadRequest("Không thể đăng ký khóa học, vui lòng thử lại.");


            return Ok(new
            {
                Message = "Đăng ký khóa học thành công.",
                CoursePaymentId = result
            });
        }


    }
}
