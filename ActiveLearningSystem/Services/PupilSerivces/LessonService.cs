using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.Services.PublicServices;
using AutoMapper;
using ActiveLearningSystem.Services.PupilSerivces;
using ActiveLearningSystem.ViewModel.PupilViewModels;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.PupilSerivces
{
    public class LessonService : ILessonService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IVideoService _videoService;

        public LessonService(AlsContext context, IMapper mapper, IVideoService videoService)
        {
            _context = context;
            _mapper = mapper;
            _videoService = videoService;
        }

        public async Task<List<LessonVM>> GetLessonsByModuleIdAsync(int moduleId)
        {
            var lessons = await _context.Lessons
                .Where(l => l.ModuleId == moduleId)
                .ToListAsync();

            return _mapper.Map<List<LessonVM>>(lessons);
        }

        public async Task<LessonVM?> GetLessonDetailByIdAsync(int lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null) return null;

            var vm = _mapper.Map<LessonVM>(lesson);

            if (!string.IsNullOrEmpty(vm.Link))
            {
                var uri = new Uri(vm.Link);
                var fileName = Path.GetFileName(uri.LocalPath);
                var courseId = lesson.Module?.CourseId;
                var folder = courseId?.ToString() ?? "default";
                vm.SecuredVideoLink = _videoService.GenerateSignedUrl( fileName, 120);
            }

            return vm;
        }

    }

}
