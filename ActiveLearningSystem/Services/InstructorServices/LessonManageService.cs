using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.Services.PupilSerivces;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public class LessonManageService : ILessonManageService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IVideoService _videoService;
        public LessonManageService(AlsContext context, IMapper mapper, IVideoService videoService)
        {
            _context = context;
            _mapper = mapper;
            _videoService = videoService;
        }

        public List<LessonViewVM> GetAllVideo(int moduleId)
        {
            var lessons = _context.Lessons
                .Include(l => l.Module) // cần để lấy CourseId từ Module
                .Where(x => x.ModuleId == moduleId)
                .ToList();

            var vmList = _mapper.Map<List<LessonViewVM>>(lessons);

            foreach (var vm in vmList)
            {
                if (!string.IsNullOrEmpty(vm.Link))
                {
                    var uri = new Uri(vm.Link);
                    var fileName = Path.GetFileName(uri.LocalPath);

                    var lesson = lessons.First(l => l.Id == vm.Id);
                    var courseId = lesson.Module?.CourseId;
                    var folder = courseId?.ToString() ?? "default";

                    vm.SecuredVideoLink = _videoService.GenerateSignedUrl(fileName, 120);
                }
            }

            return vmList;
        }


        public async Task<bool> CreateLessonAsync(LessonCreateVM lessonCreateVM)
        {
            // Kiểm tra Link
            if (!string.IsNullOrWhiteSpace(lessonCreateVM.Link) && lessonCreateVM.Link.Length > 200)
                throw new Exception("Link không được vượt quá 200 ký tự.");

            // Kiểm tra Description
            if (!string.IsNullOrWhiteSpace(lessonCreateVM.Description) && lessonCreateVM.Description.Length > 200)
                throw new Exception("Description không được vượt quá 200 ký tự.");

            // Lấy VideoNum lớn nhất trong module này
            var lastVideoNum = await _context.Lessons
                .Where(l => l.ModuleId == lessonCreateVM.ModuleId)
                .OrderByDescending(l => l.VideoNum)
                .Select(l => l.VideoNum)
                .FirstOrDefaultAsync();

            // Nếu chưa có video nào → để 1, ngược lại cộng thêm 1
            int newVideoNum = (lastVideoNum > 0) ? lastVideoNum + 1 : 1;

            var newLesson = new Lesson
            {
                Title = lessonCreateVM.Title,
                Link = lessonCreateVM.Link,
                Description = lessonCreateVM.Description,
                VideoNum = newVideoNum,
                ModuleId = lessonCreateVM.ModuleId,
                DurationSeconds = lessonCreateVM.DurationSeconds,
                Status = false,
                CreatedDate = DateOnly.FromDateTime(DateTime.Now)
            };

            _context.Lessons.Add(newLesson);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> UpdateLessonAsync(int lessonId, LessonUpdateVM lessonUpdateVM)
        {
            var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == lessonId);
            if (lesson == null)
                throw new Exception("Không tìm thấy Lesson.");

            if (!string.IsNullOrWhiteSpace(lessonUpdateVM.Link) && lessonUpdateVM.Link.Length > 200)
                throw new Exception("Link không được vượt quá 200 ký tự.");

            if (!string.IsNullOrWhiteSpace(lessonUpdateVM.Description) && lessonUpdateVM.Description.Length > 200)
                throw new Exception("Description không được vượt quá 200 ký tự.");

            lesson.Title = lessonUpdateVM.Title;
            lesson.Link = lessonUpdateVM.Link;
            lesson.Description = lessonUpdateVM.Description;
            lesson.VideoNum = lessonUpdateVM.VideoNum;
            lesson.UpdatedDate = DateOnly.FromDateTime(DateTime.Now);
            lesson.DurationSeconds = lessonUpdateVM.DurationSeconds;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteLessonAsync(int lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null)
                return false;

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}