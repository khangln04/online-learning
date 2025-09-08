using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.ViewModel.PupilViewModels;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.PupilSerivces
{
    public class RegisterCourseService : IRegisterCourseService
    {
        private readonly AlsContext _context;
        private readonly IMailService _mailService;

        public RegisterCourseService(AlsContext context, IMailService mailService)
        {
            _context = context;
            _mailService = mailService;
        }

        public async Task<int?> RegisterCourseAsync(int pupilId, int courseId)
        {
            var exists = await _context.StudentCourses
                .AnyAsync(sc => sc.PupilId == pupilId && sc.CourseId == courseId);

            if (exists)
                return -1;

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == courseId && c.Status);

            if (course == null)
                return -2;

            var pupilProfile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == pupilId);

            if (pupilProfile == null || pupilProfile.ParentId == null)
                return -3;

            var parentId = pupilProfile.ParentId.Value;

            var studentCourse = new StudentCourse
            {
                PupilId = pupilId,
                CourseId = courseId,
                Status = 1
            };

            _context.StudentCourses.Add(studentCourse);
            await _context.SaveChangesAsync();

            var coursePayment = new CoursePayment
            {
                StudentCourseId = studentCourse.StudentCourseId,
                PaidById = parentId,
                Amount = course.Price,
                IsPaid = false,
                PaidAt = null
            };

            _context.CoursePayments.Add(coursePayment);
            await _context.SaveChangesAsync();

            // ==== Gửi email nhắc thanh toán ====
            var parentProfile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == parentId);

            if (parentProfile != null && !string.IsNullOrEmpty(parentProfile.Email))
            {
                string subject = "💳 Thanh toán khóa học";

                string body = $@"
                <div style='font-family: Roboto, Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1)'>
                    <div style='background:#ff9800; color:white; text-align:center; padding:25px 20px'>
                        <h2 style='margin:0;font-weight:500'>Thanh toán</h2>
                    </div>
                    <div style='padding:20px; font-size:16px; color:#333; line-height:1.6'>
                        <p>Xin chào phụ huynh <b style='color:#e65100'>{parentProfile.Name}</b>,</p>
                        <p>Học sinh <b style='color:#e65100'>{pupilProfile.Name}</b> vừa đăng ký khóa học:</p>
                        <p style='font-size:18px; font-weight:600; color:#1e88e5'>{course.CourseName}</p>
                        <p>Số tiền cần thanh toán: <span style='color:#d32f2f; font-weight:700'>{course.Price:N0} VNĐ</span></p>
                        <p style='margin-top:15px'>Vui lòng thanh toán để kích hoạt khóa học cho học sinh.</p>
                    </div>
                    <div style='background:#f9f9f9; text-align:center; padding:15px; color:#777; font-size:13px'>
                        Đây là email tự động. Vui lòng không trả lời.
                    </div>
                </div>";

                await _mailService.SendEmailAsync(parentProfile.Email, subject, body);
            }

            return coursePayment.Id;
        }

    }
}
