using ActiveLearningSystem.Services.AdminServices;
using ActiveLearningSystem.ViewModel.AdminViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Controllers.AdminController
{
    [Route("api/admin/[controller]")]
    [ApiController]
    public class AccountListController : ControllerBase
    {
        private readonly IAccountListService _accountListService;

        public AccountListController(IAccountListService accountListService)
        {
            _accountListService = accountListService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public IActionResult GetAccounts(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            bool? status = null)
        {
            try
            {
                var accounts = _accountListService.GetAccounts(page, pageSize, search, status);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("ban/unban/{id}")]
        public IActionResult UpdateAccountStatus(int id, [FromQuery] bool status)
        {
            try
            {
                _accountListService.UpdateAccountStatus(id, status);

                var action = status ? "đã được mở khóa" : "đã bị khóa";
                return Content($"Tài khoản {action} thành công.");
            }
            catch (Exception ex)
            {
                return Content(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("details/{id}")]
        public IActionResult GetAccountDetails(int id)
        {
            try
            {
                var details = _accountListService.GetAccountDetailsById(id);
                if (details == null)
                    return NotFound("Không tìm thấy tài khoản!");

                return Ok(details);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public IActionResult CreateAccount([FromBody] CreateAccount model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                _accountListService.CreateAccountByAdmin(model);
                return Ok(new { message = "Tạo tài khoản thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpGet("valid-roles")]
        public IActionResult GetValidRoles()
        {
            try
            {
                var roles = _accountListService.GetValidRoles();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }
    }
}