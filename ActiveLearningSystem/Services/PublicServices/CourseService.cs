using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.PublicServices
{
    public class CourseService : ICourseService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;
        private readonly IVideoService _videoService;
        public CourseService(AlsContext context, IMapper mapper, IFileService fileService, IVideoService videoService)
        {
            _context = context;
            _mapper = mapper;
            _fileService = fileService;
            _videoService = videoService;
        }
        //phân trang 
        public (List<CourseVM> Courses, int TotalRecords, int TotalPages) GetCourses(
    int pageIndex = 1,
    string? keyword = null,
    string? className = null,
    string? categoryName = null,
    int pageSize = 5)
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 5;

            var query = _context.Courses
                .Include(c => c.Author)
                .Include(c => c.Category)
                .Include(c => c.Class)
                .Where(c => c.Status == true) 
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var cleanKeyword = keyword.Trim();
                query = query.Where(c => EF.Functions.Like(c.CourseName, $"%{cleanKeyword}%"));
            }

            if (!string.IsNullOrWhiteSpace(className))
            {
                var cleanClass = className.Trim();
                query = query.Where(c => EF.Functions.Like(c.Class.Name, $"%{cleanClass}%"));
            }

            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                var cleanCategory = categoryName.Trim();
                query = query.Where(c => EF.Functions.Like(c.Category.Name, $"%{cleanCategory}%"));
            }

            query = query.OrderByDescending(c => c.CreatedDate);

            int totalRecords = query.Count();

            var pagedCourses = query
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var courseVMs = _mapper.Map<List<CourseVM>>(pagedCourses);
            int totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

            return (courseVMs, totalRecords, totalPages);
        }

        public CourseVM? GetCourseDetail(int courseId)
        {
            var course = _context.Courses
                .Include(c => c.Author)
                .Include(c => c.Category)
                .Include(c => c.Class)
                .Include(c => c.Feedbacks)
                    .ThenInclude(f => f.Author)
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .FirstOrDefault(c => c.CourseId == courseId);

            if (course == null) return null;

            // Tính trung bình đánh giá
            var totalRating = course.Feedbacks.Sum(f => f.Rate);
            var feedbackCount = course.Feedbacks.Count;
            var averageRating = feedbackCount > 0 ? (double)totalRating / feedbackCount : 0;

            // Lấy module đầu tiên
            var module = course.Modules
                .FirstOrDefault(m => m.ModuleNum == 1);

            // Lấy bài học đầu tiên trong module đó
            var lesson = module?.Lessons
                .FirstOrDefault(l => l.VideoNum == 1);

            // Ánh xạ sang CourseVM
            var courseVm = _mapper.Map<CourseVM>(course);
            courseVm.AverageRating = averageRating;
            courseVm.VideoLink = lesson?.Link ?? string.Empty;

            // Tạo SecuredLink nếu có Link
            if (!string.IsNullOrEmpty(lesson?.Link))
            {
                var uri = new Uri(lesson.Link);
                var fileName = Path.GetFileName(uri.LocalPath);
                var folder = module?.CourseId.ToString() ?? "default";
                courseVm.SecuredLink = _videoService.GenerateSignedUrl( fileName, 120);
            }
            else
            {
                courseVm.SecuredLink = string.Empty;
            }

            return courseVm;
        }



    }
}
