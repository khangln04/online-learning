using ActiveLearningSystem.Services.AuthenServices;
using ActiveLearningSystem.ViewModel.AuthenViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ActiveLearningSystem.Helpers;

namespace ActiveLearningSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpPost("pre-register")]
        public async Task<IActionResult> PreRegister([FromBody] CreateAccountVM model)
        {
            try
            {
                var token = await _accountService.PreRegisterAsync(model);
                return Ok(new { token });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpVM model)
        {
            try
            {
                var result = await _accountService.VerifyAndCreateAccountAsync(model.Token, model.Otp);
                return Ok("Đăng ký và xác thực OTP thành công.");
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPost("request-reset-password")]
        public async Task<IActionResult> RequestResetPassword([FromBody] ResetPasswordRequestVM model)
        {
            var result = await _accountService.RequestResetPasswordAsync(model.Email);
            if (!result)
                return NotFound("Email không tồn tại trong hệ thống.");

            return Ok("Link reset mật khẩu đã được gửi đến email.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordVM model)
        {
            var result = await _accountService.ResetPasswordAsync(model.Token, model.NewPassword);
            if (!result)
                return BadRequest("Token không hợp lệ hoặc đã hết hạn");

            return Ok("Đổi mật khẩu thành công.");
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordVM model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int accountId = JwtClaimHelper.GetAccountId(User);
                var result = await _accountService.ChangePasswordAsync(model, accountId);
                return Ok("Đổi mật khẩu thành công.");
            }
            catch (Exception ex)
            {
                var allClaims = User.Claims.Select(c => new { c.Type, c.Value });
                return StatusCode(400, new
                {
                    error = ex.Message,
                    detail = ex.InnerException?.Message,
                    claims = allClaims
                });
            }
        }

        // Controllers/AccountController.cs
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpVM model)
        {
            try
            {
                var token = await _accountService.ResendOtpAsync(model);
                return Ok(new { token, message = "OTP đã được gửi lại đến email đã đăng ký." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}