    using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.Identity.Client;
using ActiveLearningSystem.ViewModel.AdminViewModels;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public class CourseListService : ICourseListService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;

        private const int ROLE_MANAGER = 2;

        public CourseListService(AlsContext context, IMapper mapper, IFileService fileService)
        {
            _context = context;
            _mapper = mapper;
            _fileService = fileService;
        }

        public List<CourseVM> GetAllCourses()
        {
            var courses = _context.Courses
                .Include(c => c.Author)
                .Include(c => c.Category)
                .Include(c => c.Class)
                .ToList();

            return _mapper.Map<List<CourseVM>>(courses);
        }

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
        public async Task<(List<CourseVM> Courses, int TotalRecords, int TotalPages)> GetCoursesById(
     int accountId,
     int pageIndex = 1,
     string? keyword = null,
     string? className = null,
     string? categoryName = null,
     int pageSize = 5)
        {
            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (user == null)
            {
                return (new List<CourseVM>(), 0, 0); // hoặc throw exception nếu muốn
            }

            int userId = user.UserId;

            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 5;

            var query = _context.Courses
                .Include(c => c.Author)
                .Include(c => c.Category)
                .Include(c => c.Class)
                .AsQueryable();

            query = query.Where(c => c.AuthorId == userId);

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

            int totalRecords = await query.CountAsync();

            var pagedCourses = await query
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

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
                .FirstOrDefault(c => c.CourseId == courseId);

            return course == null ? null : _mapper.Map<CourseVM>(course);
        }

        public async Task<bool> CreateCourseAsync(CourseCreateVM courseVM, IFormFile image, int accountId)
        {
            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;



            if (string.IsNullOrWhiteSpace(courseVM.CourseName))
                throw new Exception("Tên khóa học không được để trống.");

            // Regex chỉ cho phép chữ cái, số, khoảng trắng và một số ký tự tiếng Việt có dấu
            if (!System.Text.RegularExpressions.Regex.IsMatch(courseVM.CourseName, @"^[\p{L}\p{N}\s\-]+$"))
                throw new Exception("Tên khóa học không được chứa ký tự đặc biệt (ngoại trừ dấu gạch ngang).");


            if (string.IsNullOrWhiteSpace(courseVM.Description))
                throw new Exception("Mô tả không được để trống.");
           

            if (image == null || image.Length == 0)
                throw new Exception("Ảnh khóa học không hợp lệ.");

            var existingName = await _context.Courses.AnyAsync(c => c.CourseName == courseVM.CourseName);
            if (existingName)
                throw new Exception("Tên khóa học đã tồn tại, vui lòng chọn tên khác.");

            var imagePath = await _fileService.UploadImageAsync(image, "course");

            var newCourse = new Course
            {
                CourseName = courseVM.CourseName.Trim(),
                Description = courseVM.Description?.Trim(),
                Price = 0,
                Status = false,
                AuthorId = userId,
                CategoryId = courseVM.CategoryId,
                ClassId = courseVM.ClassId,
                CreatedDate = DateOnly.FromDateTime(DateTime.Now),
                Image = imagePath
            };

            _context.Courses.Add(newCourse);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCourseAsync(int courseId, CourseUpdateVM courseVM, IFormFile? image, int accountId)
        {
            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;


            var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId);
            if (course == null)
                throw new Exception("Không tìm thấy khóa học cần cập nhật.");

            if (string.IsNullOrWhiteSpace(courseVM.CourseName))
                throw new Exception("Tên khóa học không được để trống.");

            if (courseVM.Price < 0)
                throw new Exception("Giá khóa học không hợp lệ.");

            var existingName = await _context.Courses
                .AnyAsync(c => c.CourseName == courseVM.CourseName && c.CourseId != courseId);
            if (existingName)
                throw new Exception("Tên khóa học đã tồn tại, vui lòng chọn tên khác.");

            course.CourseName = courseVM.CourseName.Trim();
            course.Description = courseVM.Description?.Trim();
            course.Price = courseVM.Price;
            course.CategoryId = courseVM.CategoryId;
            course.ClassId = courseVM.ClassId;
            course.UpdatedDate = DateOnly.FromDateTime(DateTime.Now);

            if (image != null && image.Length > 0)
            {
                // Upload ảnh mới
                var newImagePath = await _fileService.UploadImageAsync(image, "course");

                // Xóa ảnh cũ nếu muốn
                if (!string.IsNullOrEmpty(course.Image))
                {
                    _fileService.DeleteImage(course.Image);
                }

                course.Image = newImagePath; // gán đường dẫn mới
            }
            // Nếu không có ảnh mới → giữ nguyên course.Image

            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> SetCourseStatusAsync(int courseId, bool newStatus)
        {
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null)
                throw new Exception("Không tìm thấy khóa học.");

            // Kiểm tra Price > 0 mới cho phép đổi trạng thái
            if (course.Price <= 0)
                throw new Exception("Khóa học phải có giá lớn hơn 0 mới được xuất bản.");

            // Cập nhật status của course
            course.Status = newStatus;

            // Lấy tất cả modules và lessons liên quan chỉ với 2 query
            var modules = await _context.Modules
                .Where(m => m.CourseId == courseId)
                .ToListAsync();

            var moduleIds = modules.Select(m => m.Id).ToList();

            var lessons = await _context.Lessons
                .Where(l => moduleIds.Contains(l.ModuleId))
                .ToListAsync();

            // Cập nhật status cho tất cả module
            foreach (var module in modules)
            {
                module.Status = newStatus;
            }

            // Cập nhật status cho tất cả lesson
            foreach (var lesson in lessons)
            {
                lesson.Status = newStatus;
            }

            await _context.SaveChangesAsync();
            return true;
        }





        public List<ClassVM> GetClassDropdown()
        {

            return _context.Classes
                   .Select(c => new ClassVM { Id = c.Id, Name = c.Name })
                   .ToList();
        }

        public List<CategoryVM> GetCategoryDropdown()
        {
            return _context.Categories.Select(c => new CategoryVM { Id = c.Id, Name = c.Name }).ToList();
        }
    }
}
