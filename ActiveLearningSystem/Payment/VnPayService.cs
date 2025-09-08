using System.Security.Cryptography;
using System.Text;
using System.Web;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

namespace ActiveLearningSystem.Payment
{
    public class VnPayService : IVnPayService
    {
        private readonly AlsContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly IMailService _emailService;

        public VnPayService(AlsContext context, IConfiguration configuration, IMapper mapper, IMailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
            _emailService = emailService;
        }

        public string CreatePaymentUrl(int accountId, int coursePaymentId, HttpContext context)
        {
            var profile = _context.Profiles.FirstOrDefault(p => p.AccountId == accountId);
            if (profile == null)
                throw new Exception("Không tìm thấy thông tin phụ huynh.");

            int parentUserId = profile.UserId;

            var payment = _context.CoursePayments
                .Include(cp => cp.StudentCourse).ThenInclude(sc => sc.Course)
                .Include(cp => cp.StudentCourse.Pupil)
                .FirstOrDefault(cp =>
                    cp.Id == coursePaymentId &&
                    cp.StudentCourse.Pupil.ParentId == parentUserId &&
                    !cp.IsPaid);

            if (payment == null)
                throw new Exception("Khóa học đã thanh toán thành công,không thể thanh toán lại!");

            var pay = new VnPayLibrary();
            var callbackUrl = _configuration["Vnpay:PaymentBackReturnUrl"];
            var timeNow = DateTime.Now.ToString("yyyyMMddHHmmss");

            var txnRef = $"{payment.Id}-{timeNow}";

            pay.AddRequestData("vnp_Version", _configuration["Vnpay:Version"]);
            pay.AddRequestData("vnp_Command", _configuration["Vnpay:Command"]);
            pay.AddRequestData("vnp_TmnCode", _configuration["Vnpay:TmnCode"]);
            pay.AddRequestData("vnp_Amount", ((int)payment.Amount * 100).ToString());
            pay.AddRequestData("vnp_CreateDate", timeNow);
            pay.AddRequestData("vnp_CurrCode", _configuration["Vnpay:CurrCode"]);
            pay.AddRequestData("vnp_IpAddr", GetIpAddress(context));
            pay.AddRequestData("vnp_Locale", _configuration["Vnpay:Locale"]);
            pay.AddRequestData("vnp_OrderInfo", payment.StudentCourse.Course.CourseName);
            pay.AddRequestData("vnp_OrderType", "education");
            pay.AddRequestData("vnp_ReturnUrl", callbackUrl);
            pay.AddRequestData("vnp_TxnRef", txnRef);

            return pay.CreateRequestUrl(_configuration["Vnpay:BaseUrl"], _configuration["Vnpay:HashSecret"]);
        }



        public CoursePaymentVM PaymentExecute(IQueryCollection collections)
        {
            var pay = new VnPayLibrary();
            var response = pay.GetFullResponseData(collections, _configuration["Vnpay:HashSecret"]);

            var payment = _context.CoursePayments
                .Include(cp => cp.StudentCourse).ThenInclude(sc => sc.Course)
                .Include(cp => cp.StudentCourse.Pupil)
                .Include(cp => cp.VnPayPayments)
                .Include(cp => cp.StudentCourse.Pupil.Parent)
                .FirstOrDefault(cp => cp.Id == response.Id);

            if (payment == null)
                throw new Exception("Không tìm thấy thông tin thanh toán.");

            var parentProfile = _context.Profiles.FirstOrDefault(p => p.UserId == payment.PaidById);
            if (parentProfile == null)
                throw new Exception("Không tìm thấy thông tin người thanh toán.");

            var parentEmail = parentProfile.Email;
            var parentName = parentProfile.Name;

            var log = response.VnPayPayments.First();

            var vnPayLog = new VnPayPayment
            {
                CoursePaymentId = payment.Id,
                TransactionId = log.TransactionId,
                OrderInfo = log.OrderInfo,
                Amount = log.Amount,
                BankCode = log.BankCode,
                CardType = log.CardType,
                ResponseCode = log.ResponseCode,
                SecureHash = log.SecureHash,
                PaidDate = DateOnly.FromDateTime(DateTime.Now),
                TransactionStatus = log.TransactionStatus 
            };

            _context.VnPayPayments.Add(vnPayLog);

            if (response.IsPaid)
            {
                payment.IsPaid = true;
                payment.PaidAt = DateOnly.FromDateTime(DateTime.Now);
                payment.StudentCourse.Status = 4;
            }

             _context.SaveChanges();

            string subject, htmlBody;

            if (response.IsPaid)
            {
                subject = "🎉 Xác nhận thanh toán thành công";
                htmlBody = $@"
                <div style='font-family: Roboto, Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1)'>
                    <div style='background:#4caf50; color:white; text-align:center; padding:25px 20px'>
                        <h2 style='margin:0;font-weight:500'>✅ Thanh toán thành công</h2>
                    </div>
                    <div style='padding:20px; font-size:16px; color:#333; line-height:1.6'>
                        <p>Xin chào phụ huynh <b style='color:#2e7d32'>{parentName}</b>,</p>
                        <p>Bạn đã <span style='color:#4caf50;font-weight:600'>thanh toán thành công</span> cho khóa học:</p>
                        <p style='font-size:18px; font-weight:600; color:#1e88e5'>{payment.StudentCourse.Course.CourseName}</p>
                        <p>Số tiền: <span style='color:#d32f2f; font-weight:700'>{payment.Amount:N0} VNĐ</span></p>
                        <p style='margin-top:20px'>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
                    </div>
                    <div style='background:#f9f9f9; text-align:center; padding:15px; color:#777; font-size:13px'>
                        Đây là email tự động. Vui lòng không trả lời.
                    </div>
                </div>";
            }
            else
            {
                subject = "❌ Thanh toán thất bại";
                htmlBody = $@"
                <div style='font-family: Roboto, Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1)'>
                    <div style='background:#f44336; color:white; text-align:center; padding:25px 20px'>
                        <h2 style='margin:0;font-weight:500'>❌ Thanh toán thất bại</h2>
                    </div>
                    <div style='padding:20px; font-size:16px; color:#333; line-height:1.6'>
                        <p>Xin chào phụ huynh <b style='color:#c62828'>{parentName}</b>,</p>
                        <p>Thanh toán cho khóa học:</p>
                        <p style='font-size:18px; font-weight:600; color:#1e88e5'>{payment.StudentCourse.Course.CourseName}</p>
                        <p style='color:#f44336; font-weight:600'>Thanh toán thất bại!</p>
                        <p style='margin-top:20px'>Vui lòng thử lại.</p>
                    </div>
                    <div style='background:#f9f9f9; text-align:center; padding:15px; color:#777; font-size:13px'>
                        Đây là email tự động. Vui lòng không trả lời.
                    </div>
                </div>";
            }


            _emailService.SendEmailAsync(parentEmail, subject, htmlBody).Wait();

            return _mapper.Map<CoursePaymentVM>(payment);
        }

        private string GetIpAddress(HttpContext context)
        {
            return context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }
    }

}

