using ActiveLearningSystem.Services.AuthenServices;
using ActiveLearningSystem.ViewModel.AuthenViewModels;
using Microsoft.AspNetCore.Mvc;

namespace ActiveLearningSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// Đăng nhập hệ thống
        /// <param name="login">Thông tin đăng nhập</param>
        /// <returns>Thông tin người dùng nếu thành công</returns>
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginVM login)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check nếu chỉ nhập space
            if (string.IsNullOrWhiteSpace(login.Username) || string.IsNullOrWhiteSpace(login.Password))
            {
                return BadRequest(new LoginResponseVM
                {
                    Success = false,
                    Message = "Không được để trống hoặc chỉ chứa khoảng trắng"
                });
            }

            var result = _authService.Login(login);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
