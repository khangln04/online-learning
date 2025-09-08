using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.ParentServices;
using ActiveLearningSystem.ViewModel.ManagerViewModels;
using ActiveLearningSystem.ViewModel.ParentViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Controllers.ParentController
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParentController : ControllerBase
    {
        private readonly AlsContext _context;
        private readonly IChildrenProgressService _childProgressService;
        private readonly IPaidCourseHistoryService _paidCourseHistoryService;
        private readonly ICheckProgressServices _checkProgressService;

        public ParentController(AlsContext context, IChildrenProgressService childProgressService, IPaidCourseHistoryService paidCourseHistoryService, ICheckProgressServices checkProgressService)
        {
            _context = context;
            _childProgressService = childProgressService;
            _paidCourseHistoryService = paidCourseHistoryService;
            _checkProgressService = checkProgressService;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<ParentDashboardVM>> GetDashboard()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            var dashboard = await _childProgressService.GetDashboardAsync(accountId);
            if (dashboard == null)
            {
                return NotFound("Không tìm thấy dữ liệu cho tài khoản này.");
            }
            return Ok(dashboard);
        }

        [HttpGet("courses/{userId}")]
        public async Task<ActionResult<List<CourseOverviewVM>>> GetCoursesByStudent(int userId)
        {
            var courses = await _childProgressService.GetCoursesByStudentAsync(userId);
            if (courses == null || courses.Count == 0)
            {
                return NotFound("Không tìm thấy khóa học cho học sinh này.");
            }
            return Ok(courses);
        }

        [HttpGet("course-progress/{courseStudentId}")]
        public async Task<ActionResult<CourseProgressDetailVM>> GetCourseProgressDetail(int courseStudentId)
        {
            var progressDetail = await _childProgressService.GetCourseProgressDetailAsync(courseStudentId);
            if (progressDetail == null)
            {
                return NotFound("Không tìm thấy thông tin tiến trình học cho khóa học này.");
            }
            return Ok(progressDetail);
        }

        [Authorize(Roles = "Parent")]
        [HttpGet("paid-history")]
        public async Task<IActionResult> GetPaidHistory()
        {
            var userIdClaim = User.FindFirst("id");
            if (userIdClaim == null)
                return Unauthorized("Không tìm thấy thông tin đăng nhập.");

            int accountId = int.Parse(userIdClaim.Value);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null)
                return BadRequest("Không tìm thấy thông tin hồ sơ học sinh.");

            var history = await _paidCourseHistoryService.GetPaidHistoryForParentAsync(profile.UserId);

            return Ok(history);
        }

        [Authorize(Roles = "Parent")]
        [HttpGet("unpaid-history")]
        public async Task<IActionResult> GetUnpaidHistory()
        {
            var userIdClaim = User.FindFirst("id");
            if (userIdClaim == null)
                return Unauthorized("Không tìm thấy thông tin đăng nhập.");

            int accountId = int.Parse(userIdClaim.Value);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null)
                return BadRequest("Không tìm thấy thông tin hồ sơ học sinh.");

            var history = await _paidCourseHistoryService.GetUnpaidHistoryForParentAsync(profile.UserId);

            return Ok(history);
        }

        [Authorize(Roles = "Parent")]
        [HttpGet("MyChildrenCourses")]
        public async Task<IActionResult> GetCoursesByChildren()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            var result = await _checkProgressService.GetCoursesByParentAsync(accountId);

            if (result == null || result.Count == 0)
                return NotFound("Không tìm thấy khóa học của các học sinh liên kết.");

            return Ok(result);
        }

        [Authorize(Roles = "Parent")]
        [HttpGet("MyChildrenCompleteCourses")]
        public async Task<IActionResult> GetCompleteCoursesByChildren()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            var result = await _checkProgressService.GetCompleteCoursesByParentAsync(accountId);

            if (result == null || result.Count == 0)
                return NotFound("Không tìm thấy khóa học của các học sinh liên kết.");

            return Ok(result);
        }
    }
}
