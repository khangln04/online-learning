using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.ViewModel;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
namespace ActiveLearningSystem.Services.MarketerServices
{
    public class CourseTestService : ICourseTestService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;
        private readonly IVideoService _videoService;
        public CourseTestService(AlsContext context, IMapper mapper, IFileService fileService, IVideoService videoService)
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
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Quizzs)
                .Include(c => c.Feedbacks)
                    .ThenInclude(f => f.Author)
                .FirstOrDefault(c => c.CourseId == courseId);

            if (course == null) return null;

            // Tính rating
            var totalRating = course.Feedbacks.Sum(f => f.Rate);
            var feedbackCount = course.Feedbacks.Count;
            var averageRating = feedbackCount > 0 ? totalRating / feedbackCount : 0;

            // Mapping sang VM (ViewModel chỉ giữ dữ liệu cần thiết)
            var courseVm = new CourseVM
            {
                CourseId = course.CourseId,
                CourseName = course.CourseName,
                CreatedDate = course.CreatedDate,
                UpdatedDate = course.UpdatedDate,
                Description = course.Description,
                Image = course.Image,
                Price = course.Price,
                AverageRating = averageRating,
                Status = course.Status,
                AuthorId = course.AuthorId,
                AuthorName = course.Author?.Name ?? "",
                CategoryId = course.CategoryId,
                CategoryName = course.Category?.Name ?? "",
                ClassId = course.ClassId,
                ClassName = course.Class?.Name ?? "",
                Modules = course.Modules.Select(m => new ModuleVM
                {
                    Id = m.Id,
                    ModuleName = m.ModuleName,
                    Description = m.Description,
                    ModuleNum = m.ModuleNum,
                    Status = m.Status,
                    CourseId = course.CourseId,
                    CourseName = course.CourseName,
                    Lessons = m.Lessons.Select(l => new LessonViewVM
                    {
                        Id = l.Id,
                        Title = l.Title,
                        Link = l.Link,
                        SecuredVideoLink = !string.IsNullOrEmpty(l.Link) && Uri.TryCreate(l.Link, UriKind.Absolute, out var uri)
                            ? _videoService.GenerateSignedUrl( Path.GetFileName(uri.LocalPath), 120)
                            : null
                    }).ToList(),
                    Quizzs = m.Quizzs.Select(q => new QuizzViewVM
                    {
                        Id = q.Id,
                        Title = q.Title,
                        Description = q.Description,
                        QuestionCount = q.QuestionCount,
                        TimeLimit = q.TimeLimit,
                        CreateAt = q.CreateAt,
                        ModuleId = q.ModuleId,
                        RequiredScore = q.RequiredScore,
                        Status = q.Status
                        // Loại bỏ Module navigation để tránh vòng lặp JSON
                    }).ToList()
                }).ToList(),
                
            };

            return courseVm;
        }
        public async Task<List<QuestionWithAnswersVM>> GetQuestionsByQuizzIdAsync(int quizzId)
        {
            // 1. Lấy danh sách TopicId của Quizz
            var topicIds = await _context.QuizzTopics
                .Where(qt => qt.QuizzId == quizzId)
                .Select(qt => qt.TopicId)
                .ToListAsync();

            if (!topicIds.Any())
                return new List<QuestionWithAnswersVM>();

            // 2. Lấy danh sách Question kèm Answers, chỉ lấy dữ liệu cần thiết
            var questions = await _context.Questions
                .Where(q => topicIds.Contains(q.TopicId))
                .Include(q => q.Answers)
                .Select(q => new QuestionWithAnswersVM
                {
                    Id = q.Id,
                    Content = q.Content,
                    TopicId = q.TopicId,
                    Answers = q.Answers.Select(a => new AnswerVM
                    {
                        Id = a.Id,
                        Content = a.Content,
                        IsCorrect = a.IsCorrect
                    }).ToList()
                })
                .ToListAsync();

            return questions;
        }

       
       




    }
}
