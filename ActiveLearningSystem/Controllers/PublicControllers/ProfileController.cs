using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers.PublicControllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly IMyProfileService _profileService;

        public ProfileController(IMyProfileService profileService)
        {
            _profileService = profileService;
        }

        // API lấy thông tin profile và tài khoản đã liên kết
        [Authorize]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            // Trong thực tế bạn sẽ lấy từ claim identity
            //int userId = int.Parse(User.FindFirst("id")!.Value);
            int userId = JwtClaimHelper.GetAccountId(User);
            var profile = await _profileService.GetMyProfileAsync(userId);
            return Ok(profile);
        }

        // API liên kết tài khoản
        [Authorize]
        [HttpPost("link-account")]
        public async Task<IActionResult> LinkAccount([FromBody] LinkAccountVM vm)
        {
            if (string.IsNullOrEmpty(vm.Email)) return BadRequest("Email không được để trống.");
            //int userId = int.Parse(User.FindFirst("id")!.Value);
            int userId = JwtClaimHelper.GetAccountId(User);

            try
            {
                var success = await _profileService.LinkAccountAsync(userId, vm);
                return success ? Ok("Liên kết thành công.") : StatusCode(500, "Thất bại khi liên kết.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // edit profile api function
        [Authorize]
        [HttpPut("my-profile")]
        public async Task<IActionResult> UpdateMyProfile([FromForm] EditMyProfileVM vm, IFormFile? avatar)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                .Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { message = "Dữ liệu không hợp lệ.", errors });
            }

            int userId = JwtClaimHelper.GetAccountId(User);

            try
            {
                // xử lý lưu ảnh nếu có
                string? avatarPath = null;
                if (avatar != null && avatar.Length > 0)
                {
                    var ext = Path.GetExtension(avatar.FileName);
                    var fileName = $"avatar_{userId}_{Guid.NewGuid():N}{ext}";
                    var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Profile");
                    if (!Directory.Exists(folderPath))
                        Directory.CreateDirectory(folderPath);

                    var fullPath = Path.Combine(folderPath, fileName);
                    using var stream = new FileStream(fullPath, FileMode.Create);
                    await avatar.CopyToAsync(stream);

                    avatarPath = $"/Profile/{fileName}";
                }

                var success = await _profileService.UpdateMyProfileAsync(userId, vm, avatarPath);
                return success ? Ok("Cập nhật thành công.") : StatusCode(500, "Cập nhật thất bại.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Lỗi cập nhật: {ex.Message}");
            }
        }

    }
}
