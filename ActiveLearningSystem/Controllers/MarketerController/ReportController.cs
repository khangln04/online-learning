using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MarketerServices;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly AlsContext _context;

        public ReportController(IReportService reportService, IHubContext<NotificationHub> hubContext, AlsContext context)
        {
            _reportService = reportService;
            _hubContext = hubContext;
            _context = context;
        }

        [HttpPost("create")]
        [Authorize(Roles = "Marketer")]
        public async Task<IActionResult> CreateReport([FromForm] CreateReportVM vm)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                              .Select(e => e.ErrorMessage)
                                              .ToList();
                return BadRequest(new { success = false, message = "Lỗi dữ liệu gửi lên", errors });
            }

            var userId = JwtClaimHelper.GetAccountId(User);
            var result = await _reportService.CreateReportAsync(vm, userId);

            if (!result.Success)
                return BadRequest(new { success = false, message = result.Message });

            return Ok(new { success = true, message = result.Message });
        }

        [HttpGet("managers")]
        [Authorize(Roles = "Marketer")]
        public async Task<IActionResult> GetManagers()
        {
            var managers = await _reportService.GetAllManagersAsync();
            return Ok(managers);
        }

        [HttpGet("instructors")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetInstructors()
        {
            var result = await _reportService.GetAllInstructorsAsync();
            return Ok(result);
        }

        [HttpGet("list")]
        [Authorize(Roles = "Marketer,Manager,Instructor")]
        public async Task<IActionResult> GetMyReports()
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            var reports = await _reportService.GetMyReportsAsync(accountId);
            return Ok(reports);
        }

        [HttpGet("{reportId}/detail")]
        [Authorize(Roles = "Marketer,Manager,Instructor")]
        public async Task<IActionResult> GetReportDetail(int reportId)
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            try
            {
                var detail = await _reportService.GetReportDetailAsync(reportId, accountId);
                // Join group khi xem detail
                var userId = JwtClaimHelper.GetAccountId(User);
                await _hubContext.Clients.User(userId.ToString()).SendAsync("JoinReportGroup", reportId);
                return Ok(detail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{reportId}/status")]
        [Authorize(Roles = "Marketer,Manager,Instructor")]
        public async Task<IActionResult> UpdateReportStatus(int reportId, [FromBody] UpdateStatusVM vm)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var accountId = JwtClaimHelper.GetAccountId(User);
            try
            {
                var result = await _reportService.UpdateReportStatusAsync(reportId, vm, accountId);
                return Ok(new { success = true, message = "Status updated successfully", newStatus = result.NewStatusName });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{reportId}/comment")]
        [Authorize(Roles = "Marketer,Manager,Instructor")]
        public async Task<IActionResult> AddComment(int reportId, [FromBody] CreateCommentVM vm)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var accountId = JwtClaimHelper.GetAccountId(User);
            try
            {
                var result = await _reportService.AddCommentAsync(reportId, vm, accountId);

                // Lấy thông tin comment vừa tạo để trả về đầy đủ
                var profile = await _context.Profiles
                    .Include(p => p.Role)
                    .FirstOrDefaultAsync(p => p.AccountId == accountId);
                var commentResponse = new
                {
                    success = true,
                    message = "Comment added successfully",
                    id = result.CommentId,
                    commentText = vm.CommentText,
                    createdAt = DateTime.Now,
                    userName = profile?.Name,
                    roleName = profile?.Role?.Name
                };
                return Ok(commentResponse);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{reportId}/download")]
        [Authorize(Roles = "Marketer,Manager,Instructor")]
        public async Task<IActionResult> DownloadReportFiles(int reportId)
        {
            var accountId = JwtClaimHelper.GetAccountId(User);
            try
            {
                var fileStream = await _reportService.DownloadReportFilesAsync(reportId, accountId);
                var fileName = $"Report_{reportId}_Files.zip";
                return File(fileStream, "application/zip", fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}