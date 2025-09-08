// File: Services/StatServices/StatService.cs
using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.StatServices
{
    public class StatService : IStat
    {
        private readonly AlsContext _context;

        public StatService(AlsContext context)
        {
            _context = context;
        }

        public async Task<DashboardVM> GetDashboardAsync()
        {
            var totalCourses = await _context.Courses.CountAsync();
            var publishedCourses = await _context.Courses.CountAsync(c => c.Status == true);
            var totalPupils = await _context.Profiles.CountAsync(p => p.RoleId == 6); // kiểm tra RoleId thực tế trong DB

            var courses = await _context.Courses
                .Select(c => new CourseListItemVM
                {
                    CourseId = c.CourseId,
                    CourseName = c.CourseName,
                    Price = c.Price,
                    Status = c.Status,
                    CreatedDate = c.CreatedDate.ToDateTime(TimeOnly.MinValue),
                    Description = c.Description   // ✅ thêm mô tả
                }).ToListAsync();

            return new DashboardVM
            {
                TotalCourses = totalCourses,
                PublishedCourses = publishedCourses,
                TotalPupils = totalPupils,
                Courses = courses
            };
        }

        // StatService.cs (chỉ sửa phần lấy Course + mapping Level)
        public async Task<CourseDetailVM?> GetCourseDetailAsync(int courseId)
        {
            var course = await _context.Courses
                .Include(c => c.Author)
                .Include(c => c.Class)   // ✅ load thêm Class
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null) return null;

            var feedbacks = await _context.Feedbacks
                .Where(f => f.CourseId == courseId)
                .Include(f => f.Author)
                .ToListAsync();

            var totalFeedback = feedbacks.Count;
            var avgRate = totalFeedback > 0 ? feedbacks.Average(f => f.Rate) : 0;

            var registeredNotPaid = await _context.StudentCourses
                .Where(sc => sc.CourseId == courseId &&
                             !_context.CoursePayments.Any(cp => cp.StudentCourseId == sc.StudentCourseId && cp.IsPaid))
                .CountAsync();

            var paidUsers = await _context.CoursePayments
                .Where(cp => _context.StudentCourses.Any(sc => sc.StudentCourseId == cp.StudentCourseId && sc.CourseId == courseId) && cp.IsPaid)
                .CountAsync();

            var completedUsers = await _context.CourseProgresses
                .Where(cp => _context.StudentCourses.Any(sc => sc.StudentCourseId == cp.CourseStudentId && sc.CourseId == courseId) && cp.Status == true)
                .CountAsync();

            var totalRevenue = await _context.CoursePayments
                .Where(cp => _context.StudentCourses.Any(sc => sc.StudentCourseId == cp.StudentCourseId && sc.CourseId == courseId) && cp.IsPaid)
                .SumAsync(cp => cp.Amount);

            return new CourseDetailVM
            {
                CourseId = course.CourseId,
                CourseName = course.CourseName,
                InstructorName = course.Author != null ? course.Author.Name : "Unknown",
                UpdatedDate = (course.UpdatedDate ?? DateOnly.FromDateTime(DateTime.Now)).ToDateTime(TimeOnly.MinValue),
                Description = course.Description,
                Level = course.Class?.Name ?? "Không xác định",   // ✅ fix lấy tên lớp từ bảng Class
                TotalFeedback = totalFeedback,
                AverageRate = Math.Round(avgRate, 2),
                Image = course.Image,
                Price = course.Price,
                RegisteredNotPaid = registeredNotPaid,
                PaidUsers = paidUsers,
                CompletedUsers = completedUsers,
                TotalRevenue = totalRevenue,
                Feedbacks = feedbacks.Select(f => new AddFeedbackVM
                {
                    UserName = f.Author.Name,
                    Rate = f.Rate,
                    CreatedDate = f.CreatedDate.ToDateTime(TimeOnly.FromDateTime(DateTime.Now)),
                    Content = f.Content
                }).ToList()
            };
        }

        // ✅ Thêm feedback (chỉ cho phép khi đã thanh toán)
        // StatService.cs
        public async Task<ServiceResultVM> AddFeedbackAsync(int courseId, int userId, int rate, string content)
        {
            var studentCourse = await _context.StudentCourses
                .Include(sc => sc.Pupil)
                .Where(sc => sc.CourseId == courseId && sc.PupilId == userId)
                .FirstOrDefaultAsync();

            if (studentCourse == null)
                return new ServiceResultVM { Success = false, Message = "❌ Bạn chưa đăng ký khóa học này." };

            var isPaid = await _context.CoursePayments
                .AnyAsync(cp => cp.StudentCourseId == studentCourse.StudentCourseId && cp.IsPaid);

            if (!isPaid)
                return new ServiceResultVM { Success = false, Message = "❌ Bạn chưa thanh toán khóa học này." };

            var alreadyFeedback = await _context.Feedbacks
                .AnyAsync(f => f.CourseId == courseId && f.AuthorId == userId);

            if (alreadyFeedback)
                return new ServiceResultVM { Success = false, Message = "❌ Bạn đã feedback khóa học này rồi." };

            var feedback = new Feedback
            {
                CourseId = courseId,
                AuthorId = userId,
                Rate = rate,
                Content = content,
                CreatedDate = DateOnly.FromDateTime(DateTime.Now),
                Status = true
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return new ServiceResultVM { Success = true, Message = "✅ Feedback thành công." };
        }


        // ✅ Lấy danh sách feedback của 1 course
        public async Task<List<AddFeedbackVM>> GetFeedbacksByCourseAsync(int courseId)
        {
            var feedbacks = await _context.Feedbacks
                .Where(f => f.CourseId == courseId)
                .Include(f => f.Author)
                .ToListAsync();

            return feedbacks.Select(f => new AddFeedbackVM
            {
                UserName = f.Author.Name,
                Rate = f.Rate,
                CreatedDate = f.CreatedDate.ToDateTime(TimeOnly.MinValue),
                Content = f.Content
            }).ToList();
        }
    }
}
