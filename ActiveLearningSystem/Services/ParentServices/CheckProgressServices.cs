using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.ViewModel.ParentViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.ParentServices
{
    public class CheckProgressServices : ICheckProgressServices
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public CheckProgressServices(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task<List<PupilCourseGroupVM>> GetCoursesByParentAsync(int accountId)
        {
            var parentProfile = await _context.Profiles
                .Include(p => p.InverseParent)
                .FirstOrDefaultAsync(p => p.AccountId == accountId);

            if (parentProfile == null || !parentProfile.InverseParent.Any())
                return new List<PupilCourseGroupVM>();

            var result = new List<PupilCourseGroupVM>();

            foreach (var child in parentProfile.InverseParent)
            {
                var studentCourses = await _context.StudentCourses
                    .Where(sc => sc.PupilId == child.UserId &&
                                (sc.Status == 2 || sc.Status == 4))
                    .Include(sc => sc.Course)
                    .Include(sc => sc.CourseProgresses)
                    .Include(sc => sc.StatusNavigation)
                    .OrderBy(sc => sc.Status == 4 ? 0 : 1)
                    .ThenByDescending(sc => sc.StudentCourseId)
                    .ToListAsync();

                result.Add(new PupilCourseGroupVM
                {
                    PupilUserId = child.UserId,
                    PupilName = child.Name,
                    Avatar = child.Avatar,
                    Courses = _mapper.Map<List<CourseOverviewVM>>(studentCourses)
                });
            }

            return result;
        }

        public async Task<List<PupilCourseGroupVM>> GetCompleteCoursesByParentAsync(int accountId)
        {
            var parentProfile = await _context.Profiles
                .Include(p => p.InverseParent)
                .FirstOrDefaultAsync(p => p.AccountId == accountId);

            if (parentProfile == null || !parentProfile.InverseParent.Any())
                return new List<PupilCourseGroupVM>();

            var result = new List<PupilCourseGroupVM>();

            foreach (var child in parentProfile.InverseParent)
            {
                var studentCourses = await _context.StudentCourses
                    .Where(sc => sc.PupilId == child.UserId && sc.Status == 3)
                .Include(sc => sc.Course)
                .Include(sc => sc.CourseProgresses)
                .Include(sc => sc.StatusNavigation)
                .OrderByDescending(sc => sc.StudentCourseId)
                .ToListAsync();

                result.Add(new PupilCourseGroupVM
                {
                    PupilUserId = child.UserId,
                    PupilName = child.Name,
                    Avatar = child.Avatar,
                    Courses = _mapper.Map<List<CourseOverviewVM>>(studentCourses)
                });
            }

            return result;
        }
    }
}

