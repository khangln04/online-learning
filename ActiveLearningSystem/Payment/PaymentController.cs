using ActiveLearningSystem.Model;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Payment
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly AlsContext _context;
        private readonly IVnPayService _vnPayService;

        public PaymentController(AlsContext context, IVnPayService vnPayService, IMapper mapper)
        {
            _vnPayService = vnPayService;
            _context = context;
            _mapper = mapper;
        }

        [Authorize(Roles = "Parent")]
        [HttpPost("create-payment/{coursePaymentId}")]
        public IActionResult CreatePayment(int coursePaymentId)
        {
            try
            {
                var userIdClaim = User.FindFirst("id");
                if (userIdClaim == null)
                    return Unauthorized("Không tìm thấy thông tin đăng nhập.");

                int accountId = int.Parse(userIdClaim.Value);
                var paymentUrl = _vnPayService.CreatePaymentUrl(accountId, coursePaymentId, HttpContext);

                return Ok(new { PaymentUrl = paymentUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Khóa học đã được thanh toán thành công!", Error = ex.Message });
            }
        }

        [HttpGet("vnpay-return")]
        public IActionResult PaymentCallback()
        {
            try
            {
                var result = _vnPayService.PaymentExecute(Request.Query);

                if (result.IsPaid)
                {
                    return Redirect("https://localhost:3000/payment-result?status=success");
                }
                else
                {
                    return Redirect("https://localhost:3000/payment-result?status=fail");
                }
            }
            catch (Exception ex)
            {
                return Redirect("https://localhost:3000/payment-result?status=fail");
            }
        }
    }
}
